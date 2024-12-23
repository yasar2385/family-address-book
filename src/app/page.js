import Image from "next/image";
import styles from "./page.module.css";

import Dashboard from "./dashboard/page";


export default function Home() {
  return (
    <>
      {/* <div className="flex justify-center h-screen"><h1 className="text-white text-4xl font-bold">Tailwind CSS is Working!</h1>      </div> */}
        <Dashboard/>
    </>
    
  );
}
