<script lang="ts">
  import { page } from '$app/state';
  import * as Sidebar from '$lib/components/ui/sidebar';

  let { children } = $props();
  const features = [
    {
      label: 'Dashboard',
      link: '/dashboard'
    },
    {
      label: 'Next 7 days',
      link: '/next-7-days'
    },
    {
      label: 'All my tasks',
      link: '/tasks'
    },
    {
      label: 'Calendar',
      link: '/calendar'
    }
  ];

  let currentFeature = $derived.by(() => {
    return features.find((feature) => feature.link === page.route.id) || features[0];
  });
</script>

<Sidebar.Provider>
  <Sidebar.Root>
    <Sidebar.Header>
      <a href="/" class="text-xl font-bold">My Planner</a>
    </Sidebar.Header>
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each features as feature (feature.link)}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton>
                  {#snippet child({ props })}
                    <a href={feature.link} {...props}>
                      {feature.label}
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
      <Sidebar.Group>
        <Sidebar.GroupLabel>My List</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton>
                {#snippet child({ props })}
                  <a {...props}> Personal </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton>
                {#snippet child({ props })}
                  <a {...props}> Company </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton>
                {#snippet child({ props })}
                  <a {...props}> VC Team </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer />
  </Sidebar.Root>

  {@render children?.()}
</Sidebar.Provider>
