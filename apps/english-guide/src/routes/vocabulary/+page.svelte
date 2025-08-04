<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Card } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { VocabularyCard } from '$lib/components/vocabulary';
  import { 
    Search, 
    Filter, 
    BookOpen, 
    Brain, 
    Target,
    ChevronLeft,
    ChevronRight,
    Loader2
  } from 'lucide-svelte';
  import type { VocabularyResponse, VocabularyListResponse } from 'features/vocabulary/types';
  import { DifficultyLevel } from '$lib/types';

  let searchQuery = $state('');
  let selectedDifficulty: DifficultyLevel | '' = $state('');
  let selectedTags: string[] = $state([]);
  let vocabularyWords: VocabularyResponse[] = $state([]);
  let totalWords = $state(0);
  let currentPage = $state(1);
  let isLoading = $state(false);
  let isSearching = $state(false);
  let availableTags: string[] = $state([]);
  
  const WORDS_PER_PAGE = 12;

  onMount(() => {
    // Get initial query parameters
    const urlParams = new URLSearchParams($page.url.search);
    searchQuery = urlParams.get('q') || '';
    selectedDifficulty = (urlParams.get('difficulty') as DifficultyLevel) || '';
    currentPage = parseInt(urlParams.get('page') || '1');
    
    loadVocabularyWords();
    loadAvailableTags();
  });

  async function loadVocabularyWords() {
    isLoading = true;
    try {
      const params = new URLSearchParams();
      
      if (selectedDifficulty) {
        params.set('difficulty', selectedDifficulty);
      }
      
      if (selectedTags.length > 0) {
        selectedTags.forEach(tag => params.append('tags', tag));
      }
      
      params.set('limit', WORDS_PER_PAGE.toString());
      params.set('offset', ((currentPage - 1) * WORDS_PER_PAGE).toString());

      let endpoint = '/api/vocabulary';
      if (searchQuery.trim()) {
        endpoint = '/api/vocabulary/search';
        params.set('q', searchQuery.trim());
      }

      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch vocabulary words');
      }

      const data: VocabularyListResponse = await response.json();
      vocabularyWords = data.items;
      totalWords = data.total;
    } catch (error) {
      console.error('Error loading vocabulary words:', error);
      vocabularyWords = [];
      totalWords = 0;
    } finally {
      isLoading = false;
    }
  }

  async function loadAvailableTags() {
    try {
      // For now, we'll use a static list of common tags
      // In a real implementation, this would come from the API
      availableTags = [
        'business', 'academic', 'daily-life', 'technology', 
        'science', 'arts', 'sports', 'food', 'travel', 'emotions'
      ];
    } catch (error) {
      console.error('Error loading tags:', error);
      availableTags = [];
    }
  }

  async function handleSearch() {
    if (isSearching) return;
    
    isSearching = true;
    currentPage = 1;
    updateURL();
    await loadVocabularyWords();
    isSearching = false;
  }

  function handleDifficultyChange(difficulty: DifficultyLevel | '') {
    selectedDifficulty = difficulty;
    currentPage = 1;
    updateURL();
    loadVocabularyWords();
  }

  function handleTagToggle(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
    currentPage = 1;
    updateURL();
    loadVocabularyWords();
  }

  function handlePageChange(newPage: number) {
    currentPage = newPage;
    updateURL();
    loadVocabularyWords();
  }

  function updateURL() {
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    
    if (selectedDifficulty) {
      params.set('difficulty', selectedDifficulty);
    }
    
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }

    const newURL = `/vocabulary${params.toString() ? '?' + params.toString() : ''}`;
    goto(newURL, { replaceState: true, noScroll: true });
  }

  function handleWordClick(wordId: string) {
    goto(`/vocabulary/${wordId}`);
  }

  function clearFilters() {
    searchQuery = '';
    selectedDifficulty = '';
    selectedTags = [];
    currentPage = 1;
    updateURL();
    loadVocabularyWords();
  }

  let totalPages = $derived(Math.ceil(totalWords / WORDS_PER_PAGE));
  let hasFilters = $derived(searchQuery.trim() || selectedDifficulty || selectedTags.length > 0);
</script>

<svelte:head>
  <title>Vocabulary Learning - English Guide</title>
  <meta name="description" content="Browse and learn English vocabulary words with AI-powered explanations" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-foreground mb-2">Vocabulary Learning</h1>
    <p class="text-muted-foreground">
      Discover and learn new English words with AI-powered explanations and examples
    </p>
  </div>

  <!-- Quick Actions -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    <Card class="p-4">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-blue-100 rounded-lg">
          <Target class="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 class="font-semibold text-foreground">Take a Quiz</h3>
          <p class="text-sm text-muted-foreground">Test your vocabulary knowledge</p>
        </div>
      </div>
      <Button 
        class="w-full mt-3" 
        variant="outline"
        onclick={() => goto('/vocabulary/quiz')}
      >
        Start Quiz
      </Button>
    </Card>

    <Card class="p-4">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-green-100 rounded-lg">
          <Brain class="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 class="font-semibold text-foreground">Spaced Repetition</h3>
          <p class="text-sm text-muted-foreground">Review words you need to practice</p>
        </div>
      </div>
      <Button 
        class="w-full mt-3" 
        variant="outline"
        onclick={() => goto('/vocabulary/review')}
      >
        Start Review
      </Button>
    </Card>

    <Card class="p-4">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-purple-100 rounded-lg">
          <BookOpen class="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 class="font-semibold text-foreground">Browse Words</h3>
          <p class="text-sm text-muted-foreground">Explore vocabulary by category</p>
        </div>
      </div>
      <Button 
        class="w-full mt-3" 
        variant="outline"
        onclick={clearFilters}
      >
        Browse All
      </Button>
    </Card>
  </div>

  <!-- Search and Filters -->
  <Card class="p-6 mb-6">
    <div class="space-y-4">
      <!-- Search Bar -->
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vocabulary words..."
            class="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            bind:value={searchQuery}
            onkeydown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onclick={handleSearch} disabled={isSearching}>
          {#if isSearching}
            <Loader2 class="h-4 w-4 animate-spin" />
          {:else}
            <Search class="h-4 w-4" />
          {/if}
        </Button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex items-center gap-2">
          <Filter class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm font-medium text-foreground">Filters:</span>
        </div>

        <!-- Difficulty Filter -->
        <div class="flex gap-2">
          <Button
            variant={selectedDifficulty === '' ? 'default' : 'outline'}
            size="sm"
            onclick={() => handleDifficultyChange('')}
          >
            All Levels
          </Button>
          <Button
            variant={selectedDifficulty === 'beginner' ? 'default' : 'outline'}
            size="sm"
            onclick={() => handleDifficultyChange(DifficultyLevel.BEGINNER)}
          >
            Beginner
          </Button>
          <Button
            variant={selectedDifficulty === 'intermediate' ? 'default' : 'outline'}
            size="sm"
            onclick={() => handleDifficultyChange(DifficultyLevel.INTERMEDIATE)}
          >
            Intermediate
          </Button>
          <Button
            variant={selectedDifficulty === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onclick={() => handleDifficultyChange(DifficultyLevel.ADVANCED)}
          >
            Advanced
          </Button>
        </div>

        {#if hasFilters}
          <Button variant="ghost" size="sm" onclick={clearFilters}>
            Clear Filters
          </Button>
        {/if}
      </div>

      <!-- Tag Filters -->
      {#if availableTags.length > 0}
        <div class="space-y-2">
          <span class="text-sm font-medium text-foreground">Categories:</span>
          <div class="flex flex-wrap gap-2">
            {#each availableTags as tag}
              <Badge
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                class="cursor-pointer hover:bg-primary/10 transition-colors"
                onclick={() => handleTagToggle(tag)}
              >
                {tag}
              </Badge>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </Card>

  <!-- Results -->
  <div class="mb-6">
    <div class="flex items-center justify-between mb-4">
      <div class="text-sm text-muted-foreground">
        {#if isLoading}
          Loading vocabulary words...
        {:else if searchQuery.trim()}
          Found {totalWords} words for "{searchQuery}"
        {:else}
          Showing {vocabularyWords.length} of {totalWords} vocabulary words
        {/if}
      </div>
      
      {#if totalPages > 1}
        <div class="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
      {/if}
    </div>

    <!-- Vocabulary Grid -->
    {#if isLoading}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each Array(6) as _}
          <Card class="p-6 animate-pulse">
            <div class="h-6 bg-gray-200 rounded mb-4"></div>
            <div class="h-4 bg-gray-200 rounded mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          </Card>
        {/each}
      </div>
    {:else if vocabularyWords.length === 0}
      <Card class="p-8 text-center">
        <BookOpen class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 class="text-lg font-semibold text-foreground mb-2">No words found</h3>
        <p class="text-muted-foreground mb-4">
          {#if hasFilters}
            Try adjusting your search criteria or filters
          {:else}
            No vocabulary words are available at the moment
          {/if}
        </p>
        {#if hasFilters}
          <Button onclick={clearFilters}>Clear Filters</Button>
        {/if}
      </Card>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each vocabularyWords as word}
          <button 
            onclick={() => handleWordClick(word.id)} 
            class="cursor-pointer text-left w-full"
            type="button"
          >
            <VocabularyCard
              vocabulary={word}
              showDefinition={false}
              showProgress={false}
            />
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Pagination -->
  {#if totalPages > 1 && !isLoading}
    <div class="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onclick={() => handlePageChange(currentPage - 1)}
      >
        <ChevronLeft class="h-4 w-4" />
        Previous
      </Button>

      <div class="flex gap-1">
        {#each Array(Math.min(5, totalPages)) as _, i}
          {@const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i}
          {#if pageNum <= totalPages}
            <Button
              variant={pageNum === currentPage ? 'default' : 'outline'}
              size="sm"
              onclick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </Button>
          {/if}
        {/each}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onclick={() => handlePageChange(currentPage + 1)}
      >
        Next
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  {/if}
</div>