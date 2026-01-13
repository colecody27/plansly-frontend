<script lang="ts">
  import { Country, State, City } from 'country-state-city';

  export let label = 'Location';
  export let location = '';
  export let country = '';
  export let state = '';
  export let city = '';
  export let idPrefix = 'location';
  export let singleInput = false;

  const countries = Country.getAllCountries();
  const allCities = City.getAllCities();

  let countryInput = '';
  let stateInput = '';
  let cityInput = '';
  let selectedCountryCode = '';
  let selectedStateCode = '';
  let selectedCountryName = '';
  let selectedStateName = '';
  let selectedCityName = '';
  let seededLocation = '';
  let seededCountry = '';
  let seededState = '';
  let seededCity = '';
  let singleInputValue = '';

  const normalize = (value: string) => value.trim().toLowerCase();

  const resolveCountry = (value: string) => {
    const normalized = normalize(value);
    const match = countries.find(
      (country) =>
        normalize(country.name) === normalized || normalize(country.isoCode) === normalized
    );
    if (match) {
      selectedCountryCode = match.isoCode;
      selectedCountryName = match.name;
      return;
    }
    selectedCountryCode = '';
    selectedCountryName = '';
  };

  const resolveState = (value: string) => {
    const normalized = normalize(value);
    const states = State.getStatesOfCountry(selectedCountryCode);
    const match = states.find(
      (state) =>
        normalize(state.name) === normalized || normalize(state.isoCode) === normalized
    );
    if (match) {
      selectedStateCode = match.isoCode;
      selectedStateName = match.name;
      return;
    }
    selectedStateCode = '';
    selectedStateName = '';
  };

  const resolveCity = (value: string) => {
    const normalized = normalize(value);
    const cities = City.getCitiesOfState(selectedCountryCode, selectedStateCode);
    const match = cities.find((city) => normalize(city.name) === normalized);
    if (match) {
      selectedCityName = match.name;
      return;
    }
    selectedCityName = '';
  };

  const handleCountryChange = () => {
    resolveCountry(countryInput);
    stateInput = '';
    cityInput = '';
    selectedStateCode = '';
    selectedStateName = '';
    selectedCityName = '';
  };

  const handleStateChange = () => {
    resolveState(stateInput);
    cityInput = '';
    selectedCityName = '';
  };

  const handleCityChange = () => {
    resolveCity(cityInput);
  };

  const resolveSingleInput = (value: string) => {
    const normalized = normalize(value);
    const match = cityOptions.find(
      (entry) => normalize(entry.label) === normalized || normalize(entry.name) === normalized
    );
    if (!match) {
      return;
    }
    const matchState = State.getStateByCodeAndCountry(match.stateCode, match.countryCode);
    const matchCountry = Country.getCountryByCode(match.countryCode);
    selectedCityName = match.name;
    selectedStateName = matchState?.name ?? '';
    selectedCountryName = matchCountry?.name ?? '';
    selectedCountryCode = match.countryCode ?? '';
    selectedStateCode = match.stateCode ?? '';
  };

  const handleSingleInputChange = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    singleInputValue = value;
    resolveSingleInput(value);
  };

  $: states = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : [];
  $: cities =
    selectedCountryCode && selectedStateCode
      ? City.getCitiesOfState(selectedCountryCode, selectedStateCode)
      : [];

  const cityOptions = allCities.map((entry) => {
    const stateMatch = State.getStateByCodeAndCountry(entry.stateCode, entry.countryCode);
    const countryMatch = Country.getCountryByCode(entry.countryCode);
    const parts = [entry.name, stateMatch?.name, countryMatch?.name].filter(Boolean);
    return {
      label: parts.join(', '),
      name: entry.name,
      stateCode: entry.stateCode,
      countryCode: entry.countryCode
    };
  });

  const applyLocationSeed = (value: string) => {
    const parts = value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (!parts.length) {
      return;
    }

    const countryName = parts[parts.length - 1];
    const stateName = parts.length > 1 ? parts[parts.length - 2] : '';
    const cityName = parts.length > 2 ? parts[0] : '';

    const matchedCountry = countries.find(
      (country) => normalize(country.name) === normalize(countryName)
    );
    if (!matchedCountry) {
      return;
    }

    selectedCountryCode = matchedCountry.isoCode;
    selectedCountryName = matchedCountry.name;
    countryInput = matchedCountry.name;

    if (stateName) {
      const states = State.getStatesOfCountry(selectedCountryCode);
      const matchedState = states.find(
        (state) => normalize(state.name) === normalize(stateName)
      );
      if (matchedState) {
        selectedStateCode = matchedState.isoCode;
        selectedStateName = matchedState.name;
        stateInput = matchedState.name;
      }
    }

    if (cityName && selectedStateCode) {
      const cities = City.getCitiesOfState(selectedCountryCode, selectedStateCode);
      const matchedCity = cities.find((city) => normalize(city.name) === normalize(cityName));
      if (matchedCity) {
        selectedCityName = matchedCity.name;
        cityInput = matchedCity.name;
      }
    }
  };

  const applyFieldsSeed = () => {
    if (country && country !== seededCountry) {
      countryInput = country;
      resolveCountry(country);
      seededCountry = country;
    }

    if (selectedCountryCode && state && state !== seededState) {
      stateInput = state;
      resolveState(state);
      seededState = state;
    }

    if (selectedCountryCode && selectedStateCode && city && city !== seededCity) {
      cityInput = city;
      resolveCity(city);
      seededCity = city;
    }
  };

  $: if (country || state || city) {
    applyFieldsSeed();
  } else if (location && location !== seededLocation && !selectedCountryCode) {
    applyLocationSeed(location);
    seededLocation = location;
  }

  $: if (selectedCountryName || selectedStateName || selectedCityName) {
    country = selectedCountryName;
    state = selectedStateName;
    city = selectedCityName;
    const parts = [selectedCityName, selectedStateName, selectedCountryName].filter(Boolean);
    location = parts.join(', ');
    if (singleInput) {
      singleInputValue = location;
    }
  } else if (!country && !state && !city) {
    location = '';
    if (singleInput) {
      singleInputValue = '';
    }
  }

  $: if (singleInput && location && location !== seededLocation) {
    singleInputValue = location;
    seededLocation = location;
  }
</script>

<label class="form-control">
  <span class="label-text">{label}</span>
  {#if singleInput}
    <input
      class="input input-bordered w-full"
      list={`${idPrefix}-city-list`}
      placeholder="Start typing a city"
      bind:value={singleInputValue}
      on:change={handleSingleInputChange}
    />
    <datalist id={`${idPrefix}-city-list`}>
      {#each cityOptions as entry}
        <option value={entry.label}></option>
      {/each}
    </datalist>
  {:else}
    <div class="grid gap-3 md:grid-cols-3">
      <div>
        <input
          class="input input-bordered w-full"
          list={`${idPrefix}-countries`}
          placeholder="Country"
          bind:value={countryInput}
          on:change={handleCountryChange}
        />
        <datalist id={`${idPrefix}-countries`}>
          {#each countries as country}
            <option value={country.name}></option>
          {/each}
        </datalist>
      </div>
      <div>
        <input
          class="input input-bordered w-full"
          list={`${idPrefix}-states`}
          placeholder="State"
          bind:value={stateInput}
          on:change={handleStateChange}
          disabled={!selectedCountryCode}
        />
        <datalist id={`${idPrefix}-states`}>
          {#each states as state}
            <option value={state.name}></option>
          {/each}
        </datalist>
      </div>
      <div>
        <input
          class="input input-bordered w-full"
          list={`${idPrefix}-cities`}
          placeholder="City"
          bind:value={cityInput}
          on:change={handleCityChange}
          disabled={!selectedStateCode}
        />
        <datalist id={`${idPrefix}-cities`}>
          {#each cities as city}
            <option value={city.name}></option>
          {/each}
        </datalist>
      </div>
    </div>
  {/if}
</label>
