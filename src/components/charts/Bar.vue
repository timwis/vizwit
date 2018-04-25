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
        :transform="`translate(${margin.left}, ${margin.top})`"
        class="bars"
        @click="onClickBar">
        <g
          v-tooltip="getTooltipContent(datum)"
          v-for="datum in initialData"
          :key="datum.label"
          :height="innerHeight - yScale(datum.value)"
          :transform="`translate(${xScale(datum.label)}, 0)`">

          <!-- Inactive, initial data, always rendered -->
          <rect
            :y="yScale(datum.value)"
            :width="xScale.bandwidth()"
            :height="innerHeight - yScale(datum.value)"
            :data-label="datum.label"
            class="bar inactive initial-data"/>

          <!-- Active initial data, when no filters set -->
          <rect
            v-if="filteredData.length === 0"
            :y="yScale(datum.value)"
            :width="xScale.bandwidth()"
            :height="innerHeight - yScale(datum.value)"
            :data-label="datum.label"
            class="bar active initial-data"/>

          <!-- Filtered data, when a value exists for this category -->
          <rect
            v-else-if="filteredDataKeyed[datum.label]"
            :y="yScale(filteredDataKeyed[datum.label].value)"
            :width="xScale.bandwidth()"
            :height="innerHeight - yScale(filteredDataKeyed[datum.label].value)"
            :data-label="datum.label"
            class="bar active filtered-data"/>

          <!-- Filtered data, 0 height, when no value exists for this category -->
          <rect
            v-else
            :y="innerHeight"
            :width="xScale.bandwidth()"
            :height="0"
            :data-label="datum.label"
            class="bar active filtered-data"/>
        </g>
      </g>
      <g
        :transform="`translate(0, ${innerHeight})`"
        class="axis axis--x">
        <g
          v-for="datum in initialData"
          :key="`tick-${datum.label}`"
          :transform="`translate(${xScale(datum.label) + (barWidth / 2)})`"
          class="tick"
          opacity="1">
          <line y2="6"/>
          <WrappingText
            :characters-per-line="8"
            :text="datum.label"
            y="9"
            dy="0.71em"/>
        </g>
      </g>
    </svg>
  </div>
</template>

<script>
import * as d3 from 'd3'
import keyBy from 'lodash/keyBy'
import { VTooltip } from 'v-tooltip'
import WrappingText from '../WrappingText'

export default {
  components: {
    WrappingText
  },
  directives: {
    'tooltip': VTooltip
  },
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
      barWidth: 75,
      margin: {
        top: 0,
        right: 0,
        bottom: 30,
        left: 0
      }
    }
  },
  computed: {
    innerHeight () {
      return this.height - this.margin.top - this.margin.bottom
    },
    filteredDataKeyed () {
      return keyBy(this.filteredData, 'label')
    },
    xScale () {
      const labels = this.initialData.map((datum) => datum.label)
      const width = this.barWidth * this.initialData.length
      return d3.scaleBand()
        .rangeRound([0, width - this.margin.left - this.margin.right])
        .paddingInner(0.1)
        .align(0)
        .domain(labels)
    },
    yScale () {
      const values = this.initialData.map((datum) => datum.value)
      return d3.scaleLinear()
        .rangeRound([this.innerHeight, 0])
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
    },
    getTooltipContent (datum) {
      let content = `
        <b>${datum.label}</b><br>
        Total: ${datum.value.toLocaleString()}
      `
      if (this.filteredDataKeyed[datum.label]) {
        content += `<br>
        Filtered: ${this.filteredDataKeyed[datum.label].value.toLocaleString()}
        `
      }
      return content
    }
  }
}
</script>

<style lang="sass">
@import '../../styles/_variables.sass'
@import '../../styles/tooltip.scss'

.chart-container
  overflow-x: auto

.chart
  .bar
    stroke-width: 0.8
    transition: height 0.3s ease-out, y 0.3s ease-out

    &.active
      fill: $chart-fill-active
      stroke: $chart-stroke-active

    &.inactive
      fill: $chart-fill-filtered
      stroke: $chart-stroke-filtered

.tooltip
  font-family: sans-serif
</style>
