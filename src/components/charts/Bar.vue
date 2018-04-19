<template>
  <svg
    ref="chart"
    :height="height"
    width="100%"
    class="chart">
    <g
      class="bars"
      @click="onClickBar">
      <g
        v-for="datum in initialData"
        :key="datum.label"
        :height="height - yScale(datum.value)"
        :transform="`translate(${xScale(datum.label)}, 0)`">
        <rect
          :y="yScale(datum.value)"
          :width="xScale.bandwidth()"
          :height="height - yScale(datum.value)"
          :data-label="datum.label"
          class="bar initial-data"/>
        <rect
          v-if="filteredDataKeyed[datum.label]"
          :y="yScale(filteredDataKeyed[datum.label].value)"
          :width="xScale.bandwidth()"
          :height="height-yScale(filteredDataKeyed[datum.label].value)"
          :data-label="datum.label"
          class="bar filtered-data"/>
      </g>
    </g>
  </svg>
</template>

<script>
import * as d3 from 'd3'
import keyBy from 'lodash/keyBy'

export default {
  props: {
    initialData: {
      type: Array,
      default: () => []
    },
    filteredData: {
      type: Array,
      default: () => []
    },
    currentSelection: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      width: 0,
      height: 450
    }
  },
  computed: {
    filteredDataKeyed () {
      return keyBy(this.filteredData, 'label')
    },
    xScale () {
      const labels = this.initialData.map((datum) => datum.label)
      return d3.scaleBand()
        .rangeRound([0, this.width])
        .padding(0.1)
        .domain(labels)
    },
    yScale () {
      const values = this.initialData.map((datum) => datum.value)
      return d3.scaleLinear()
        .rangeRound([this.height, 0])
        .domain([0, d3.max(values)])
    }
  },
  mounted () {
    window.addEventListener('resize', this.updateWidth)
    this.updateWidth() // refs are not available in `data`
  },
  destroyed () {
    window.removeEventListener('resize', this.updateWidth)
  },
  methods: {
    updateWidth () {
      this.width = this.$refs.chart.getBoundingClientRect().width
    },
    onClickBar (event) {
      const label = event.target.dataset.label
      const currentSelectionLabel = this.currentSelection && this.currentSelection.value
      if (label === currentSelectionLabel) {
        this.$emit('deselect')
      } else {
        const expression = {
          type: '=',
          value: label
        }
        this.$emit('select', expression)
      }
    }
  }
}
</script>

<style lang="sass">
.chart
  .bar
    fill: #2176d2

    &.filtered-data
      fill: #96c9ff
</style>
