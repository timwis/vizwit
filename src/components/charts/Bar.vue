<template>
  <div
    ref="container"
    class="chart-container"
    width="100%">
    <svg
      ref="chart"
      :height="height"
      :width="width"
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
            :class="{ 'is-filtered': filteredData.length > 0 }"
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
  </div>
</template>

<script>
import * as d3 from 'd3'
import keyBy from 'lodash/keyBy'

export default {
  props: {
    height: {
      type: Number,
      default: 450
    },
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
      barWidth: 75
    }
  },
  computed: {
    filteredDataKeyed () {
      return keyBy(this.filteredData, 'label')
    },
    xScale () {
      const labels = this.initialData.map((datum) => datum.label)
      const width = this.barWidth * this.initialData.length
      return d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.1)
        .align(0)
        .domain(labels)
    },
    yScale () {
      const values = this.initialData.map((datum) => datum.value)
      return d3.scaleLinear()
        .rangeRound([this.height, 0])
        .domain([0, d3.max(values)])
    },
    width () {
      return this.barWidth * this.initialData.length
    }
  },
  methods: {
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
@import '../../styles/_variables.sass'

.chart-container
  overflow-x: auto

.chart
  .bar
    fill: $chart-fill-active
    stroke: $chart-stroke-active
    stroke-width: 0.8

    &.is-filtered
      fill: $chart-fill-filtered
      stroke: $chart-stroke-filtered
</style>
