export function buildTree(members = [], relations = []) {
  const byId = new Map(members.map((member) => [member.id, member]));
  const parentsOf = new Map();
  const childrenOf = new Map();
  const spouseOf = new Map();
  const siblingsOf = new Map();

  members.forEach((member) => {
    parentsOf.set(member.id, []);
    childrenOf.set(member.id, []);
    siblingsOf.set(member.id, []);
    spouseOf.set(member.id, null);
  });

  const usableRelations = [];
  const droppedRelations = [];

  relations.forEach((relation) => {
    const { a, b, kind } = relation;
    if (!byId.has(a) || !byId.has(b) || a === b) {
      droppedRelations.push(relation);
      return;
    }
    if (!["parent", "spouse", "sibling"].includes(kind)) {
      droppedRelations.push(relation);
      return;
    }
    usableRelations.push(relation);
    if (kind === "parent") {
      if (!parentsOf.get(b).includes(a)) parentsOf.get(b).push(a);
      if (!childrenOf.get(a).includes(b)) childrenOf.get(a).push(b);
    } else if (kind === "spouse") {
      spouseOf.set(a, b);
      spouseOf.set(b, a);
    } else if (kind === "sibling") {
      if (!siblingsOf.get(a).includes(b)) siblingsOf.get(a).push(b);
      if (!siblingsOf.get(b).includes(a)) siblingsOf.get(b).push(a);
    }
  });

  const depthOf = new Map();
  const cycles = [];
  const visiting = new Set();

  function depth(id) {
    if (depthOf.has(id)) return depthOf.get(id);
    if (visiting.has(id)) {
      cycles.push(id);
      return 0;
    }
    visiting.add(id);
    const parents = parentsOf.get(id) || [];
    const value = parents.length ? 1 + Math.max(...parents.map((parentId) => depth(parentId))) : 0;
    visiting.delete(id);
    depthOf.set(id, value);
    return value;
  }

  members.forEach((member) => depth(member.id));

  const byBirthThenName = (idA, idB) => {
    const a = byId.get(idA);
    const b = byId.get(idB);
    if (a?.dateOfBirth && b?.dateOfBirth && a.dateOfBirth !== b.dateOfBirth) {
      return a.dateOfBirth < b.dateOfBirth ? -1 : 1;
    }
    return String(a?.name || "").localeCompare(String(b?.name || ""));
  };

  const rootIds = members
    .filter((member) => parentsOf.get(member.id).length === 0)
    .map((member) => member.id)
    .sort(byBirthThenName);

  const rootSet = new Set(rootIds);
  const used = new Set();
  const rootGroups = [];

  rootIds.forEach((id) => {
    if (used.has(id)) return;
    const spouse = spouseOf.get(id);
    if (spouse && rootSet.has(spouse) && !used.has(spouse)) {
      rootGroups.push([id, spouse].sort(byBirthThenName));
      used.add(id);
      used.add(spouse);
    } else {
      rootGroups.push([id]);
      used.add(id);
    }
  });

  // A child is rendered once, under its first parent, so a two-parent family
  // does not duplicate the branch.
  const anchor = new Map();
  members.forEach((member) => {
    const parents = parentsOf.get(member.id);
    if (parents.length) anchor.set(member.id, [...parents].sort()[0]);
  });

  return {
    byId,
    parentsOf,
    childrenOf,
    spouseOf,
    siblingsOf,
    depthOf,
    rootGroups,
    anchor,
    cycles: [...new Set(cycles)],
    relations: usableRelations,
    droppedRelations
  };
}

export function memberFrom(tree, id) {
  return tree.byId.get(id) || null;
}

export function childIdsFor(tree, id) {
  const spouse = tree.spouseOf.get(id);
  const own = tree.childrenOf.get(id) || [];
  const shared = spouse ? tree.childrenOf.get(spouse) || [] : [];
  const all = [...new Set([...own, ...shared])];
  return all.filter((childId) => {
    const anchorId = tree.anchor.get(childId);
    return anchorId === id || (spouse && anchorId === spouse);
  });
}

export function relativesOf(tree, id) {
  const map = (ids) => (ids || []).map((memberId) => tree.byId.get(memberId)).filter(Boolean);
  const spouseId = tree.spouseOf.get(id);
  return {
    parents: map(tree.parentsOf.get(id)),
    children: map(tree.childrenOf.get(id)),
    siblings: map(tree.siblingsOf.get(id)),
    spouse: spouseId ? tree.byId.get(spouseId) || null : null
  };
}

const PATH_LABELS = {
  parent: "parent",
  child: "child",
  spouse: "spouse",
  sibling: "sibling",
  "parent/parent": "grandparent",
  "child/child": "grandchild",
  "parent/sibling": "uncle or aunt",
  "sibling/child": "niece or nephew",
  "sibling/sibling": "sibling",
  "parent/child": "sibling",
  "parent/spouse": "parent",
  "spouse/parent": "parent-in-law",
  "spouse/sibling": "sibling-in-law",
  "child/spouse": "child-in-law",
  "spouse/child": "child",
  "sibling/parent": "parent"
};

export function relationBetween(tree, fromId, toId) {
  if (!fromId || !toId) return null;
  if (fromId === toId) return "self";

  const neighbours = (id) => {
    const list = [];
    (tree.parentsOf.get(id) || []).forEach((x) => list.push(["parent", x]));
    (tree.childrenOf.get(id) || []).forEach((x) => list.push(["child", x]));
    (tree.siblingsOf.get(id) || []).forEach((x) => list.push(["sibling", x]));
    const spouse = tree.spouseOf.get(id);
    if (spouse) list.push(["spouse", spouse]);
    return list;
  };

  const queue = [[fromId, []]];
  const seen = new Set([fromId]);

  while (queue.length) {
    const [id, path] = queue.shift();
    if (path.length >= 3) continue;
    for (const [relation, next] of neighbours(id)) {
      if (next === toId) {
        const chain = [...path, relation].join("/");
        return PATH_LABELS[chain] || relation;
      }
      if (!seen.has(next)) {
        seen.add(next);
        queue.push([next, [...path, relation]]);
      }
    }
  }
  return null;
}
