<template>
  <svg
    ref="chart"
    :height="height"
    width="100%"
    class="chart">
    <g ref="group">
      <path
        :d="area(initialData)"
        :class="{ 'is-filtered': filteredData.length > 0 }"
        class="area"/>
      <path
        :d="area(filteredData)"
        class="area filtered-data"/>
    </g>
    <g
      :transform="`translate(0,${height-30})`"
      class="axis axis--x">
      <line
        :x2="width"
        x1="0"/>
      <g
        v-for="(tick, index) in xScale.ticks()"
        v-if="index !== 0"
        :key="tick.toISOString()"
        :transform="`translate(${xScale(tick)})`"
        class="tick"
        opacity="1">
        <line y2="6"/>
        <text
          y="9"
          dy="0.71em">
          {{ getMonthYear(tick) }}
        </text>
      </g>
    </g>
  </svg>
</template>

<script>
import * as d3 from 'd3'
import formatDate from 'date-fns/format'

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
    dateFormat: {
      type: String,
      default: 'MMM YYYY'
    }
  },
  data () {
    return {
      width: 0
    }
  },
  computed: {
    xScale () {
      const labels = this.initialData.map((datum) => new Date(datum.label))
      return d3.scaleTime()
        .range([0, this.width])
        .domain(d3.extent(labels))
    },
    yScale () {
      const values = this.initialData.map((datum) => datum.value)
      return d3.scaleLinear()
        .rangeRound([this.height, 0])
        .domain([0, d3.max(values)])
    },
    area () {
      return d3.area()
        .curve(d3.curveMonotoneX)
        .x((datum) => this.xScale(new Date(datum.label)))
        .y0(this.height)
        .y1((datum) => this.yScale(datum.value))
    }
  },
  mounted () {
    window.addEventListener('resize', this.updateWidth)
    this.updateWidth() // refs are not available in `data`

    d3.select(this.$refs.group)
      .call(d3.brushX().on('end', this.onBrush))
  },
  destroyed () {
    window.removeEventListener('resize', this.updateWidth)
  },
  methods: {
    getMonthYear (date) {
      return formatDate(date, this.dateFormat)
    },
    updateWidth () {
      this.width = this.$refs.chart.getBoundingClientRect().width
    },
    onBrush () {
      const selection = d3.brushSelection(this.$refs.group)
      let expression
      if (selection) {
        const [ minDate, maxDate ] = selection.map((item) => this.xScale.invert(item))
        expression = {
          type: 'and',
          value: [
            {
              type: '>=',
              value: minDate.toISOString(),
              label: formatDate(minDate, this.dateFormat)
            },
            {
              type: '<=',
              value: maxDate.toISOString(),
              label: formatDate(maxDate, this.dateFormat)
            }
          ]
        }
        this.$emit('select', expression)
      } else {
        this.$emit('deselect')
      }
    }
  }
}
</script>

<style lang="sass">
@import '../../styles/_variables.sass'

.chart
  .area
    fill: $chart-fill-active
    stroke: $chart-stroke-active
    stroke-width: 1.5

    &.is-filtered
      fill: $chart-fill-filtered
      stroke: $chart-stroke-filtered

  .axis
    font-family: sans-serif
    text-anchor: middle

    line
      stroke: #000

    text
      fill: #000
</style>
