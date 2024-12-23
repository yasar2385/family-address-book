"use client"


import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    subject: z.string().min(5, "Subject must be at least 5 characters."),
    message: z.string().min(10, "Message must be at least 10 characters."),
});

const ContactInfo = ({ icon: Icon, title, children }) => (
    <div className="flex items-start space-x-4">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div className="space-y-1">
            <h3 className="font-medium leading-none">{title}</h3>
            <div className="text-sm text-muted-foreground">{children}</div>
        </div>
    </div>
);

const ContactPage = () => {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "",
            message: "",
        },
    });

    function onSubmit(data) {
        console.log(data);
        // Handle form submission
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Contact YazTech Innovations</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Get in touch with our team for innovative technology solutions and support.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                        <CardDescription>Find us through any of these channels</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ContactInfo icon={MapPin} title="Our Location">
                            YazTech Innovations<br />
                            Chennai, Tamil Nadu 600001<br />
                            India
                        </ContactInfo>

                        <ContactInfo icon={Phone} title="Phone">+91 95661000000</ContactInfo>

                        <ContactInfo icon={Mail} title="Email">yaztechinnovations@gmail.com</ContactInfo>

                        <ContactInfo icon={Clock} title="Business Hours">
                            Monday - Friday: 9:00 AM - 6:00 PM<br />
                            Saturday: 10:00 AM - 2:00 PM<br />
                            Sunday: Closed
                        </ContactInfo>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Send us a Message</CardTitle>
                        <CardDescription>Fill out the form below and we'll get back to you</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="your@email.com" type="email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="subject"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <FormControl>
                                                <Input placeholder="How can we help?" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Message</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Your message here..."
                                                    className="min-h-[120px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full">Send Message</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3885.845284333739!2d80.24422581482701!3d13.134522490752633!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5265dd1f8c3d5d%3A0x71c2dfa7ed57f1e0!2sYazTech%20Innovations!5e0!3m2!1sen!2sin!4v1624942234567!5m2!1sen!2sin"
                        width="100%"
                        height="400"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="rounded-lg"
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default ContactPage;