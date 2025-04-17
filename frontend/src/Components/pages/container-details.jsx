import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Box, Loader2, Search, Package, Clock, Ban, AlertCircle } from "lucide-react";

export default function ContainerDetailsPage() {
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all containers on page load
  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get("/api/containers");
      setContainers(response.data.containers || []);
    } catch (err) {
      console.error("Failed to load containers:", err);
      setError(err.response?.data?.detail || "Failed to load container data.");
    } finally {
      setLoading(false);
    }
  };

  const handleContainerSelect = async (containerId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/containers/${containerId}`);
      setSelectedContainer(response.data.container);
    } catch (err) {
      console.error("Failed to load container details:", err);
      setError(err.response?.data?.detail || "Failed to load container details.");
      setSelectedContainer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    const filteredContainers = containers.filter(
      (container) => container.containerId.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (filteredContainers.length > 0) {
      handleContainerSelect(filteredContainers[0].containerId);
    } else {
      setError("No containers found matching your search.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Container Details</h1>
        <p className="text-muted-foreground">
          View detailed information about storage containers and their contents
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Find Container</CardTitle>
              <CardDescription>
                Search for a specific container or browse the list
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter container ID..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={loading || !searchQuery.trim()} 
                  className="w-full"
                >
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Containers</CardTitle>
              <CardDescription>
                Select a container to view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && !containers.length ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {containers.map((container) => (
                    <Button
                      key={container.containerId}
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => handleContainerSelect(container.containerId)}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      <span className="truncate">{container.containerId}</span>
                    </Button>
                  ))}
                  
                  {!loading && !containers.length && (
                    <div className="py-4 text-center text-muted-foreground">
                      No containers found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedContainer ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Container: {selectedContainer.containerId}</CardTitle>
                    <CardDescription>
                      Details and contents of the selected container
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleContainerSelect(selectedContainer.containerId)}
                    >
                      <Clock className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col p-4 bg-muted rounded-md">
                      <span className="text-sm text-muted-foreground">Dimensions</span>
                      <span className="text-lg font-medium">
                        {selectedContainer.dimensions.width} × {selectedContainer.dimensions.depth} × {selectedContainer.dimensions.height} cm
                      </span>
                    </div>
                    <div className="flex flex-col p-4 bg-muted rounded-md">
                      <span className="text-sm text-muted-foreground">Used Space</span>
                      <span className="text-lg font-medium">
                        {selectedContainer.usedSpace?.toFixed(2) || 0} / {selectedContainer.totalSpace?.toFixed(2) || 0} cm³
                      </span>
                    </div>
                    <div className="flex flex-col p-4 bg-muted rounded-md">
                      <span className="text-sm text-muted-foreground">Item Count</span>
                      <span className="text-lg font-medium">
                        {selectedContainer.items?.length || 0} items
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Container Contents</h3>
                    {selectedContainer.items && selectedContainer.items.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Dimensions</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedContainer.items.map((item) => (
                            <TableRow key={item.itemId}>
                              <TableCell className="font-medium">{item.itemId}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>
                                {item.dimensions.width} × {item.dimensions.depth} × {item.dimensions.height} cm
                              </TableCell>
                              <TableCell>
                                {item.isWaste ? (
                                  <div className="flex items-center text-destructive">
                                    <Ban className="h-4 w-4 mr-1" />
                                    Waste
                                  </div>
                                ) : item.usageLimit < 3 ? (
                                  <div className="flex items-center text-amber-500">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Low usage ({item.usageLimit})
                                  </div>
                                ) : (
                                  <div className="flex items-center text-green-500">
                                    <Box className="h-4 w-4 mr-1" />
                                    Active
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground border rounded-md">
                        No items in this container
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">No Container Selected</h3>
                <p className="text-muted-foreground">
                  Select a container from the list to view its details
                </p>
                
                {error && (
                  <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md w-full">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 