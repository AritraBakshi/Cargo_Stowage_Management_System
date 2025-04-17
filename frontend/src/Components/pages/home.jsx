import { Package, Search, Clock, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

export default function HomePage() {
  const features = [
    {
      icon: Package,
      title: "Item Placement",
      description: "Optimally place items in containers based on priority and dimensions",
      link: "/placement",
      color: "text-blue-500",
    },
    {
      icon: Search,
      title: "Search & Retrieve",
      description: "Quickly find and retrieve items from storage",
      link: "/retrieve",
      color: "text-green-500",
    },
    {
      icon: Clock,
      title: "Waste Management",
      description: "Monitor and manage expired or depleted items",
      link: "/waste",
      color: "text-red-500",
    },
    {
      icon: LayoutGrid,
      title: "Container Details",
      description: "View detailed information about storage containers",
      link: "/details",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-8 pt-8">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Cargo Stowage Management System</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Efficiently manage cargo placement, retrieval, and waste management with our comprehensive solution
        </p>
      </section>

      <section className="py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="overflow-hidden">
              <CardHeader className="pb-2">
                <feature.icon className={`w-12 h-12 ${feature.color}`} />
                <CardTitle className="mt-4">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={feature.link}>
                  <Button className="w-full">Go to {feature.title}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
} 