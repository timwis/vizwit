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
        @click="onClickBar"
        @mouseover="onMouseOver"
        @mouseout="focusDatum = null">
        <g
          v-for="datum in initialData"
          :key="datum.key"
          :height="innerHeight - yScale(datum.value)"
          :transform="`translate(${xScale(datum.key)}, 0)`">

          <!-- Inactive, initial data, always rendered -->
          <rect
            :y="yScale(datum.value)"
            :width="xScale.bandwidth()"
            :height="innerHeight - yScale(datum.value)"
            :data-key="datum.key"
            class="bar inactive initial-data"/>

          <!-- Active initial data, when no filters set -->
          <rect
            v-if="filteredData.length === 0"
            :y="yScale(datum.value)"
            :width="xScale.bandwidth()"
            :height="innerHeight - yScale(datum.value)"
            :data-key="datum.key"
            class="bar active initial-data"/>

          <!-- Filtered data, when a value exists for this category -->
          <rect
            v-else-if="filteredDataKeyed[datum.key]"
            :y="yScale(filteredDataKeyed[datum.key].value)"
            :width="xScale.bandwidth()"
            :height="innerHeight - yScale(filteredDataKeyed[datum.key].value)"
            :data-key="datum.key"
            class="bar active filtered-data"/>

          <!-- Filtered data, 0 height, when no value exists for this category -->
          <rect
            v-else
            :y="innerHeight"
            :width="xScale.bandwidth()"
            :height="0"
            :data-key="datum.key"
            class="bar active filtered-data"/>
        </g>
      </g>
      <g
        :transform="`translate(0, ${innerHeight})`"
        class="axis axis--x">
        <g
          v-for="datum in initialData"
          :key="`tick-${datum.key}`"
          :transform="`translate(${xScale(datum.key) + (barWidth / 2)})`"
          class="tick"
          opacity="1">
          <line y2="6"/>
          <WrappingText
            :characters-per-line="8"
            :text="datum.key"
            y="9"
            dy="0.71em"/>
        </g>
      </g>
      <g
        v-if="focusDatum"
        :transform="`translate(${xScale(focusDatum.key)},${yScale(focusDatum.value)})`"
        class="focus">
        <foreignObject>
          <div class="tooltip">
            <h3>{{ focusDatum.key }}</h3>
            <p>Total: {{ focusDatum.value.toLocaleString() }}</p>
            <p v-if="filteredDataKeyed[focusDatum.key]">
              Filtered: {{ filteredDataKeyed[focusDatum.key].value.toLocaleString() }}
            </p>
          </div>
        </foreignObject>
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
      },
      focusDatum: null
    }
  },
  computed: {
    innerHeight () {
      return this.height - this.margin.top - this.margin.bottom
    },
    filteredDataKeyed () {
      return keyBy(this.filteredData, 'key')
    },
    xScale () {
      const keys = this.initialData.map((datum) => datum.key)
      const width = this.barWidth * this.initialData.length
      return d3.scaleBand()
        .rangeRound([0, width - this.margin.left - this.margin.right])
        .paddingInner(0.1)
        .align(0)
        .domain(keys)
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
      const key = event.target.dataset.key
      const currentSelectionLabel = this.currentSelection && this.currentSelection.value
      if (key === currentSelectionLabel) {
        this.$emit('deselect')
      } else {
        const expression = {
          type: '=',
          value: key
        }
        this.$emit('select', expression)
      }
    },
    getTooltipContent (datum) {
      let content = `
        <b>${datum.key}</b><br>
        Total: ${datum.value.toLocaleString()}
      `
      if (this.filteredDataKeyed[datum.key]) {
        content += `<br>
        Filtered: ${this.filteredDataKeyed[datum.key].value.toLocaleString()}
        `
      }
      return content
    },
    onMouseOver (event) {
      const key = event.target.dataset.key
      this.focusDatum = this.initialData.find((datum) => datum.key === key)
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../../styles/_variables.sass'
@import '../../styles/tooltip.scss'

.chart-container
  overflow-x: auto

.chart
  .bar
    stroke-width: 0.8
    transition: height 0.3s ease-out, y 0.3s ease-out
    cursor: pointer

    &.active
      fill: $chart-fill-active
      stroke: $chart-stroke-active

    &.inactive
      fill: $chart-fill-filtered
      stroke: $chart-stroke-filtered

  .axis
    text-anchor: middle

    line
      stroke: #000

    text
      fill: #000

  .focus
    foreignObject
      width: 150px
      height: 200px

    .tooltip
      width: 150px
      background-color: rgba(0, 0, 0, 0.5)
      color: #fff
      padding: 10px
      margin: 5px
      pointer-events: none

      p
        line-height: 1em
</style>
