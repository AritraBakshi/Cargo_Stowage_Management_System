import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Skeleton } from "../ui/skeleton";
import { Loader2, PackagePlus, ArrowRight } from "lucide-react";

// Define the form schema with zod
const formSchema = z.object({
  itemId: z.string().min(1, { message: "Item ID is required" }),
  name: z.string().min(1, { message: "Name is required" }),
  width: z.string().min(1, { message: "Width is required" }).refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Width must be a positive number" }
  ),
  height: z.string().min(1, { message: "Height is required" }).refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Height must be a positive number" }
  ),
  depth: z.string().min(1, { message: "Depth is required" }).refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Depth must be a positive number" }
  ),
  mass: z.string().min(1, { message: "Mass is required" }).refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Mass must be a positive number" }
  ),
  usageLimit: z.string().min(1, { message: "Usage limit is required" }).refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    { message: "Usage limit must be a positive integer" }
  ),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Priority is required",
  }),
  containerId: z.string(),
});

export default function ItemPlacementPage() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemId: "",
      name: "",
      width: "",
      height: "",
      depth: "",
      mass: "",
      usageLimit: "10",
      priority: "medium",
      containerId: "auto",
    },
  });

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    setLoading(true);
    
    try {
      const response = await axios.get("/api/containers");
      setContainers(response.data.containers || []);
    } catch (err) {
      console.error("Failed to load containers:", err);
      toast.error("Failed to load containers");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Convert numeric fields
      const payload = {
        ...data,
        width: parseFloat(data.width),
        height: parseFloat(data.height),
        depth: parseFloat(data.depth),
        mass: parseFloat(data.mass),
        usageLimit: parseInt(data.usageLimit),
        // Convert "auto" to empty string or null for API
        containerId: data.containerId === "auto" ? "" : data.containerId
      };
      
      await axios.post("/api/items", payload);
      
      toast.success("Item placed successfully!");
      form.reset();
      
    } catch (err) {
      console.error("Failed to place item:", err);
      toast.error(err.response?.data?.detail || "Failed to place item");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Item Placement</h1>
        <p className="text-muted-foreground">
          Add new items to containers with optimal placement
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Item</CardTitle>
          <CardDescription>
            Enter item details to add it to a container
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="itemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a unique ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Item name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Width in cm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          min="0"
                          placeholder="Height in cm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="depth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depth (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          min="0"
                          placeholder="Depth in cm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mass (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          min="0"
                          placeholder="Mass in kg" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Limit</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="Number of uses" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="containerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Container</FormLabel>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select container" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="auto">Auto-select best container</SelectItem>
                            {containers.map((container) => (
                              <SelectItem key={container.containerId} value={container.containerId}>
                                {container.containerId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormDescription>
                        If no container is selected, the system will choose the optimal one.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                  className="gap-2"
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <PackagePlus className="h-4 w-4" />
                      Place Item
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 