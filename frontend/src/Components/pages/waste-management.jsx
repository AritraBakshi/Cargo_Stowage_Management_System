import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Ban, Loader2, Search, CircleAlert, Clock, CheckCircle2, Trash2 } from "lucide-react";

export default function WasteManagementPage() {
  const [wasteItems, setWasteItems] = useState([]);
  const [lowUsageItems, setLowUsageItems] = useState([]);
  const [potentialWaste, setPotentialWaste] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("waste");

  useEffect(() => {
    loadWasteData();
  }, []);

  const loadWasteData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load waste items
      const wasteResponse = await axios.get("/api/waste");
      setWasteItems(wasteResponse.data.wasteItems || []);
      
      // Load low usage items (items with usage limit < 3)
      const lowUsageResponse = await axios.get("/api/items", {
        params: { usageLimitBelow: 3, isWaste: false }
      });
      setLowUsageItems(lowUsageResponse.data.items || []);
      
      // Load expired items that could be marked as waste
      const potentialResponse = await axios.get("/api/items", {
        params: { expiringSoon: true, isWaste: false }
      });
      setPotentialWaste(potentialResponse.data.items || []);
      
    } catch (err) {
      console.error("Failed to load waste data:", err);
      setError(err.response?.data?.detail || "Failed to load waste management data.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsWaste = async (itemId, reason = "Expired") => {
    setLoading(true);
    
    try {
      await axios.post("/api/waste", {
        itemId,
        reason
      });
      
      // Reload data after marking as waste
      await loadWasteData();
      
    } catch (err) {
      console.error("Failed to mark item as waste:", err);
      setError(err.response?.data?.detail || "Failed to mark item as waste.");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardItem = async (itemId) => {
    setLoading(true);
    
    try {
      await axios.delete(`/api/items/${itemId}`);
      
      // Reload data after discarding
      await loadWasteData();
      
    } catch (err) {
      console.error("Failed to discard item:", err);
      setError(err.response?.data?.detail || "Failed to discard item.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Switch to waste tab by default when searching
    setActiveTab("waste");
  };

  const filteredWasteItems = wasteItems.filter(
    item => searchQuery === "" || 
    item.itemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabContent = {
    waste: (
      <>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Waste Items</h2>
          <Badge variant="destructive" className="ml-2">
            {filteredWasteItems.length} items
          </Badge>
        </div>
        
        {filteredWasteItems.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWasteItems.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell className="font-medium">{item.itemId}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.wasteReason}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDiscardItem(item.itemId)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Discard
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 border rounded-md">
            <Ban className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No waste items found</p>
          </div>
        )}
      </>
    ),
    
    potentialWaste: (
      <>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Potential Waste Items</h2>
          <Badge variant="warning" className="ml-2">
            {potentialWaste.length} items
          </Badge>
        </div>
        
        {potentialWaste.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {potentialWaste.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell className="font-medium">{item.itemId}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-amber-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Expiring soon
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsWaste(item.itemId, "Expired")}
                      disabled={loading}
                      className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Mark as Waste
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 border rounded-md">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-muted-foreground">No potential waste items found</p>
          </div>
        )}
      </>
    ),
    
    lowUsage: (
      <>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Low Usage Items</h2>
          <Badge variant="secondary" className="ml-2">
            {lowUsageItems.length} items
          </Badge>
        </div>
        
        {lowUsageItems.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Uses Left</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowUsageItems.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell className="font-medium">{item.itemId}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={item.usageLimit === 0 ? "destructive" : "warning"}>
                      {item.usageLimit} uses left
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.usageLimit === 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsWaste(item.itemId, "Depleted")}
                        disabled={loading}
                        className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Mark as Waste
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Monitor usage
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 border rounded-md">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-muted-foreground">No low usage items found</p>
          </div>
        )}
      </>
    )
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Waste Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage expired, depleted, or wasteful items
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Waste Management Dashboard</CardTitle>
          <CardDescription>
            Monitor items that need attention or disposal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search waste items..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                Search
              </Button>
              <Button
                variant="outline"
                onClick={loadWasteData}
                disabled={loading}
                className="gap-1"
              >
                <Clock className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}

            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("waste")}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "waste"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Ban className="h-4 w-4 inline-block mr-1" />
                Waste Items ({filteredWasteItems.length})
              </button>
              <button
                onClick={() => setActiveTab("potentialWaste")}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "potentialWaste"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <CircleAlert className="h-4 w-4 inline-block mr-1" />
                Potential Waste ({potentialWaste.length})
              </button>
              <button
                onClick={() => setActiveTab("lowUsage")}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "lowUsage"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Clock className="h-4 w-4 inline-block mr-1" />
                Low Usage ({lowUsageItems.length})
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="pt-6">{tabContent[activeTab]}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 