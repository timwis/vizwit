<template>
  <component
    :is="providerComponent"
    :domain="domain"
    :dataset="dataset"
    :group-by="groupBy"
    :trigger-field="triggerField"
    :order="order"
    :filters="filters">
    <component
      :is="chartComponent"
      :current-selection="currentSelection"
      :height="height"
      :initial-data="initialData"
      :filtered-data="filteredData"
      slot-scope="{ initialData, filteredData }"
      @select="onSelect"
      @deselect="onDeselect"/>
  </component>
</template>

<script>
import Carto from './providers/CartoStub'
import Bar from './charts/Bar'
import DateTime from './charts/DateTime'

const providers = {
  carto: Carto
}
const chartTypes = {
  bar: Bar,
  datetime: DateTime
}

export default {
  components: {
    Carto,
    Bar,
    DateTime
  },
  props: {
    filters: {
      type: Object,
      default: () => {}
    },
    height: {
      type: Number,
      default: undefined
    },
    provider: {
      type: String,
      required: true
    },
    domain: {
      type: String,
      required: true
    },
    dataset: {
      type: String,
      required: true
    },
    chartType: {
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
  computed: {
    providerComponent () {
      return providers[this.provider]
    },
    chartComponent () {
      return chartTypes[this.chartType]
    },
    field () {
      return this.triggerField || this.groupBy
    },
    currentSelection () {
      return this.filters[this.field] && this.filters[this.field].expression
    }
  },
  methods: {
    onSelect (expression) {
      const filter = {
        field: this.field,
        expression
      }
      this.$emit('filter', filter)
    },
    onDeselect () {
      const filter = {
        field: this.field
        // omit expression to remove the filter
      }
      this.$emit('filter', filter)
    }
  }
}
</script>
