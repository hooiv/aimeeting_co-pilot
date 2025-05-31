import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  FilterList,
  Save,
  History,
  Clear,
  Star,
  StarBorder,
  Bookmark,
  TrendingUp,
  AccessTime,
  People,
  VideoCall,
  Subtitles,
  SmartToy,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { searchService, SearchFilters, SearchResult, SearchResponse } from '../services/search';
import { debounce } from 'lodash';

interface AdvancedSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  initialQuery?: string;
  placeholder?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onResultSelect,
  initialQuery = '',
  placeholder = 'Search meetings, recordings, transcripts, and insights...',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: undefined,
    participants: [],
    tags: [],
    duration: undefined,
    hasRecording: undefined,
    hasTranscript: undefined,
    hasInsights: undefined,
    status: [],
    hosts: [],
  });

  const [searchStats, setSearchStats] = useState({
    total: 0,
    took: 0,
    aggregations: {},
  });

  useEffect(() => {
    loadSearchHistory();
    loadSavedSearches();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await searchService.getSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const searches = await searchService.getSavedSearches();
      setSavedSearches(searches);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, searchFilters: SearchFilters) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response: SearchResponse = await searchService.search({
          query: searchQuery,
          filters: searchFilters,
          highlight: true,
          suggest: true,
          size: 20,
        });

        setResults(response.results);
        setSearchStats({
          total: response.total,
          took: response.took,
          aggregations: response.aggregations || {},
        });

        if (response.suggestions) {
          setSuggestions(response.suggestions);
        }
      } catch (error) {
        setError('Search failed. Please try again.');
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleSearch = (searchQuery: string = query) => {
    debouncedSearch(searchQuery, filters);
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    handleSearch(newQuery);
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    handleSearch(query);
  };

  const handleSaveSearch = async () => {
    try {
      const success = await searchService.saveSearch(query, filters);
      if (success) {
        setSaveDialogOpen(false);
        setSearchName('');
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  };

  const handleLoadSavedSearch = (savedSearch: any) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters || {});
    handleSearch(savedSearch.query);
  };

  const clearFilters = () => {
    setFilters({
      dateRange: undefined,
      participants: [],
      tags: [],
      duration: undefined,
      hasRecording: undefined,
      hasTranscript: undefined,
      hasInsights: undefined,
      status: [],
      hosts: [],
    });
    handleSearch(query);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <VideoCall />;
      case 'recording':
        return <VideoCall />;
      case 'transcript':
        return <Subtitles />;
      case 'insight':
        return <SmartToy />;
      default:
        return <Search />;
    }
  };

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'primary';
      case 'recording':
        return 'secondary';
      case 'transcript':
        return 'info';
      case 'insight':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Search Input */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder={placeholder}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: loading && <CircularProgress size={20} />,
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={() => setSaveDialogOpen(true)}
              disabled={!query.trim()}
            >
              Save
            </Button>
          </Box>

          {/* Search Stats */}
          {searchStats.total > 0 && (
            <Box sx={{ mt: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                {searchStats.total.toLocaleString()} results in {searchStats.took}ms
              </Typography>
              {Object.keys(filters).some(key => filters[key as keyof SearchFilters] !== undefined) && (
                <Button size="small" startIcon={<Clear />} onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </Box>
          )}
        </Paper>

        {/* Advanced Filters */}
        {showFilters && (
          <Accordion expanded sx={{ mb: 2 }}>
            <AccordionSummary>
              <Typography variant="h6">Advanced Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Start Date"
                    value={filters.dateRange?.start ? new Date(filters.dateRange.start) : null}
                    onChange={(date) => handleFilterChange({
                      dateRange: {
                        ...filters.dateRange,
                        start: date?.toISOString() || '',
                        end: filters.dateRange?.end || '',
                      }
                    })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="End Date"
                    value={filters.dateRange?.end ? new Date(filters.dateRange.end) : null}
                    onChange={(date) => handleFilterChange({
                      dateRange: {
                        start: filters.dateRange?.start || '',
                        end: date?.toISOString() || '',
                      }
                    })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={filters.participants || []}
                    onChange={(_, value) => handleFilterChange({ participants: value })}
                    renderInput={(params) => (
                      <TextField {...params} label="Participants" placeholder="Add participants" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={['standup', 'review', 'planning', 'demo', 'training']}
                    value={filters.tags || []}
                    onChange={(_, value) => handleFilterChange({ tags: value })}
                    renderInput={(params) => (
                      <TextField {...params} label="Tags" placeholder="Add tags" />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={filters.hasRecording === true}
                          onChange={(e) => handleFilterChange({ hasRecording: e.target.checked ? true : undefined })}
                        />
                      }
                      label="Has Recording"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={filters.hasTranscript === true}
                          onChange={(e) => handleFilterChange({ hasTranscript: e.target.checked ? true : undefined })}
                        />
                      }
                      label="Has Transcript"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={filters.hasInsights === true}
                          onChange={(e) => handleFilterChange({ hasInsights: e.target.checked ? true : undefined })}
                        />
                      }
                      label="Has AI Insights"
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Search Results */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {results.length > 0 ? (
              <List>
                {results.map((result) => (
                  <Card key={result.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        {getResultIcon(result.type)}
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6" component="h3">
                              {result.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={result.type}
                              color={getResultTypeColor(result.type)}
                            />
                          </Box>
                          <Typography variant="body2" color="textSecondary" paragraph>
                            {result.description}
                          </Typography>
                          {result.highlights.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              {result.highlights.map((highlight, index) => (
                                <Typography
                                  key={index}
                                  variant="body2"
                                  sx={{ fontStyle: 'italic', color: 'primary.main' }}
                                  dangerouslySetInnerHTML={{ __html: highlight }}
                                />
                              ))}
                            </Box>
                          )}
                          {result.metadata && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {result.metadata.date && (
                                <Chip size="small" icon={<AccessTime />} label={new Date(result.metadata.date).toLocaleDateString()} />
                              )}
                              {result.metadata.participants && (
                                <Chip size="small" icon={<People />} label={`${result.metadata.participants.length} participants`} />
                              )}
                              {result.metadata.tags?.map((tag) => (
                                <Chip key={tag} size="small" label={tag} variant="outlined" />
                              ))}
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Score: {result.score.toFixed(2)}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => onResultSelect?.(result)}
                          >
                            View
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </List>
            ) : query && !loading ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                  No results found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Try adjusting your search terms or filters
                </Typography>
              </Paper>
            ) : null}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Search History */}
            {searchHistory.length > 0 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Recent Searches
                  </Typography>
                  <List dense>
                    {searchHistory.slice(0, 5).map((historyQuery, index) => (
                      <ListItem
                        key={index}
                        button
                        onClick={() => handleQueryChange(historyQuery)}
                      >
                        <ListItemText primary={historyQuery} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Bookmark sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Saved Searches
                  </Typography>
                  <List dense>
                    {savedSearches.map((savedSearch) => (
                      <ListItem
                        key={savedSearch.id}
                        button
                        onClick={() => handleLoadSavedSearch(savedSearch)}
                      >
                        <ListItemText
                          primary={savedSearch.name}
                          secondary={savedSearch.query}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* Save Search Dialog */}
        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
          <DialogTitle>Save Search</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Search Name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveSearch}
              disabled={!searchName.trim()}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AdvancedSearch;
