<template>
  <svg
    ref="chart"
    :height="height"
    width="100%"
    class="chart">
    <g ref="group">
      <path
        :d="area(initialData)"
        class="area"/>
      <path
        :d="area(filteredData)"
        class="area filtered-data"/>
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
              label: minDate.toLocaleDateString()
            },
            {
              type: '<=',
              value: maxDate.toISOString(),
              label: maxDate.toLocaleDateString()
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
.chart
  .area
    fill: #96c9ff
    stroke: #2176d2
    stroke-width: 2.5px

    &.filtered-data
      fill: #f99300
</style>
