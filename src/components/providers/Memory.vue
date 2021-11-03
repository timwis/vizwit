<template>
  <div>
    <slot
      :initial-data="initialData"
      :filtered-data="filteredData"/>
  </div>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex'

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
    channel: {
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
    ...mapState({
      cube (state) {
        const dataset = state.datasets[this.channel]
        return dataset && dataset.cube
      },
      dimension (state) {
        /* this.filtersArray */
        const dataset = state.datasets[this.channel]
        return dataset && dataset.dimensions[this.field]
      },
    }),
    group () {
      return this.dimension && this.dimension.group()
    },
    // TODO: For some reason, this (a) re-runs initialData when filters change
    // (group must be getting updated), and (b) ignores the custom reducer in
    // initialData, filtering both initialData and filteredData. It doesn't
    // happen with the onChange approach, assumedly because initialData is only
    // computed once.
    /*
    initialData () {
      if (!this.group) return
      const add = (p, v, notFiltered) => notFiltered ? p + 1 : p
      const remove = (p, v, notFiltered) => notFiltered ? p -1 : p
      const initial = () => 0
      if (this.group) console.log('recomputing initialData', JSON.stringify(this.group.reduce(add, remove, initial).top(3)))
      return this.group.reduce(add, remove, initial).top(100)
    },
    filteredData () {
      this.filtersArray
      if (this.group) console.log('recomputing filteredData', JSON.stringify(this.group.reduceCount().top(3)))
      return this.group && this.group.reduceCount().top(100) 
    },
    */
    filtersArray () {
      return Object.values(this.filters)
    },
    field () {
      return this.triggerField || this.groupBy
    }
  },
  async created () {
    await this.getDataset({
      datasetName: this.dataset,
      channel: this.channel
    })
    this.createDimension({
      channel: this.channel,
      field: this.field
    })

    this.cube.onChange((eventType) => {
      if (eventType === 'filtered') this.computeFilteredData()
    })
    this.computeInitialData()
  },
  methods: {
    ...mapActions(['getDataset']),
    ...mapMutations(['createDimension']),
    computeInitialData () {
      if (!this.group) return
      const add = (p, v, notFiltered) => notFiltered ? p + 1 : p
      const remove = (p, v, notFiltered) => notFiltered ? p -1 : p
      const initial = () => 0
      this.initialData = this.group.reduce(add, remove, initial).top(100)
    },
    computeFilteredData () {
      if (!this.group) return
      this.filteredData = this.group.top(100)
    }
  }
}
</script>
