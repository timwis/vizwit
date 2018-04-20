<template>
  <div>
    <slot
      :initialData="initialData"
      :filteredData="filteredData"/>
  </div>
</template>

<script>
const fixtures = {
  initial: {
    text_general_code: require('../../../test/fixtures/crimes-by-category'),
    dc_dist: require('../../../test/fixtures/crimes-by-district'),
    dispatch_date: require('../../../test/fixtures/crimes-by-date')
  },
  filtered: {
    text_general_code: require('../../../test/fixtures/thefts-by-category'),
    dc_dist: require('../../../test/fixtures/thefts-by-district'),
    dispatch_date: require('../../../test/fixtures/thefts-by-date')
  }
}

export default {
  props: {
    filters: {
      type: Object,
      default: () => {}
    },
    domain: {
      type: String,
      required: true
    },
    dataset: {
      type: String,
      required: true
    },
    groupBy: {
      type: String,
      required: true
    },
    triggerField: {
      type: String,
      default: null
    },
    order: {
      type: String,
      default: null
    }
  },
  data () {
    return {
      initialData: [],
      filteredData: []
    }
  },
  computed: {
    filtersArray () {
      return Object.values(this.filters)
    },
    field () {
      return this.triggerField || this.groupBy
    }
  },
  watch: {
    filtersArray: 'getFilteredData'
  },
  mounted () {
    this.getInitialData()
  },
  methods: {
    async getInitialData () {
      const response = await getFixture(this.field, false)
      this.initialData = response.rows
    },
    async getFilteredData () {
      if (this.filtersArray.length === 0) {
        this.filteredData = []
      } else {
        const response = await getFixture(this.field, true)
        this.filteredData = response.rows
      }
    }
  }
}

function getFixture (groupBy, isFiltered) {
  const key = (isFiltered) ? 'filtered' : 'initial'
  const fixture = fixtures[key][groupBy]
  return Promise.resolve(fixture)
}
</script>
