<template>
  <div>
    <slot
      :initial-data="initialData"
      :filtered-data="filteredData"/>
  </div>
</template>

<script>
import axios from 'axios'
import neatCsv from 'neat-csv'

export default {
  props: {
    filters: {
      type: Object,
      default: () => {}
    },
    domain: {
      type: String,
      required: false
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
  created () {
    this.getInitialData()
  },
  methods: {
    async getInitialData () {
      const url = constructUrl(this.dataset)
      const response = await axios.get(url) // TODO: gzip this on dev server
      this.initialData = []// await neatCsv(response.data)
    },
    async getFilteredData () {
      if (this.filtersArray.length === 0) {
        this.filteredData = []
      } else {
        /* const response = await getFixture(this.field, true) */
        /* this.filteredData = response.rows */
      }
    }
  }
}

function constructUrl (filename) {
  return `data/${encodeURIComponent(filename)}`
}
</script>
