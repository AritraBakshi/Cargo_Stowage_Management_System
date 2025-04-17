import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, Box, Clock, Tag, Weight, Ruler } from "lucide-react";

export default function SearchRetrievePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("id");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get("/api/search", {
        params: {
          [searchType === "id" ? "itemId" : "itemName"]: searchQuery,
        },
      });
      
      if (response.data.found) {
        setSearchResult(response.data.item);
      } else {
        setSearchResult(null);
        setError("Item not found.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err.response?.data?.detail || "An error occurred while searching.");
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieve = async () => {
    if (!searchResult) return;
    
    setLoading(true);
    
    try {
      await axios.post("/api/retrieve", {
        itemId: searchResult.itemId,
      });
      
      // Update the local search result to reflect retrieval
      setSearchResult({
        ...searchResult,
        usageLimit: searchResult.usageLimit - 1,
      });
      
    } catch (err) {
      console.error("Retrieve error:", err);
      setError(err.response?.data?.detail || "An error occurred while retrieving the item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Search & Retrieve</h1>
        <p className="text-muted-foreground">
          Find items in storage and retrieve them when needed
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find an Item</CardTitle>
          <CardDescription>
            Search by item ID or name to locate items in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={searchType === "id" ? "Enter item ID..." : "Enter item name..."}
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={searchType === "id" ? "default" : "outline"}
                  onClick={() => setSearchType("id")}
                >
                  ID
                </Button>
                <Button 
                  variant={searchType === "name" ? "default" : "outline"}
                  onClick={() => setSearchType("name")}
                >
                  Name
                </Button>
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                Search
              </Button>
            </div>
            
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {searchResult && (
        <Card>
          <CardHeader>
            <CardTitle>Item Found</CardTitle>
            <CardDescription>
              Details of the located item
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">ID</p>
                    <p>{searchResult.itemId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p>{searchResult.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Mass</p>
                    <p>{searchResult.mass} kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dimensions</p>
                    <p>
                      {searchResult.dimensions.width} × {searchResult.dimensions.depth} × {searchResult.dimensions.height} cm
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Container</p>
                    <p>{searchResult.containerId || "Not stored"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Uses Remaining</p>
                    <p>{searchResult.usageLimit}</p>
                  </div>
                </div>
              </div>

              {searchResult.isWaste && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                  <p className="font-medium">Item marked as waste</p>
                  <p className="text-sm">Reason: {searchResult.wasteReason}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleRetrieve} 
              disabled={loading || searchResult.isWaste || searchResult.usageLimit <= 0}
              className="w-full"
            >
              Retrieve Item
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 