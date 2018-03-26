<template>
  <svg
    ref="chart"
    :height="height"
    width="100%"
    class="chart">
    <g class="bars">
      <g
        v-for="(datum, index) in initialData"
        :key="datum.label"
        :height="height - yScale(datum.value)"
        :transform="`translate(${xScale(datum.label)}, 0)`">
        <rect
          :y="yScale(datum.value)"
          :width="xScale.bandwidth()"
          height="100%"
          :height="height - yScale(datum.value)"
          class="bar initial-data"/>
        <rect
          v-if="filteredData[index]"
          :y="yScale(filteredData[index].value)"
          :width="xScale.bandwidth()"
          :height="height-yScale(filteredData[index].value)"
          class="bar filtered-data"/>
      </g>
    </g>
  </svg>
</template>

<script>
import * as d3 from 'd3'

export default {
  props: {
    initialData: {
      type: Array,
      default: () => []
    },
    filteredData: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      width: 0,
      height: 450
    }
  },
  computed: {
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
