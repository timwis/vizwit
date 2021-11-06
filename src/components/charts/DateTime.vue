<template>
  <svg
    ref="chart"
    :height="height"
    width="100%"
    class="chart">
    <g
      ref="areas"
      :transform="`translate(${margin.left}, ${margin.top})`"
      :height="innerHeight"
      @mousemove="onMouseMove"
      @mouseout="focusDatum = null">

      <!-- Inactive, initial data, always rendered -->
      <path
        :d="area(initialData)"
        class="area inactive initial-data"/>

      <!-- Active initial data, when no filters set -->
      <path
        v-if="filteredData.length === 0"
        :d="area(initialData)"
        class="area active initial-data"/>

      <!-- Filtered data -->
      <path
        v-else
        :d="area(filteredData)"
        class="area active filtered-data"/>
    </g>
    <g
      :transform="`translate(0,${innerHeight})`"
      class="axis axis--x">
      <line :x2="width"/>
      <template v-for="(tick, index) in xScale.ticks(tickCount)">
        <g
          v-if="index !== 0"
          :key="tick.toISOString()"
          :transform="`translate(${xScale(tick)})`"
          class="tick"
          opacity="1">
          <line y2="6"/>
          <WrappingText
            :characters-per-line="9"
            :text="getMonthYear(tick)"
            y="9"
            dy="0.71em"/>
        </g>
      </template>
    </g>
    <g
      v-if="focusDatum"
      :transform="`translate(${xScale(new Date(focusDatum.label))},${yScale(focusDatum.value)})`"
      class="focus">
      <circle r="4.5"/>
      <line
        :y2="innerHeight - yScale(focusDatum.value)"
        x2="3"/>
      <foreignObject>
        <div class="tooltip">
          <h3>{{ getMonthYear(focusDatum.label) }}</h3>
          <p>Total: {{ focusDatum.value.toLocaleString() }}</p>
          <p v-if="filteredDataKeyed[focusDatum.label]">
            Filtered: {{ filteredDataKeyed[focusDatum.label].value.toLocaleString() }}
          </p>
        </div>
      </foreignObject>
    </g>
  </svg>
</template>

<script>
import * as d3 from 'd3'
import formatDate from 'date-fns/format'
import keyBy from 'lodash/keyBy'
import WrappingText from '../WrappingText'

export default {
  components: {
    WrappingText
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
    dateFormat: {
      type: String,
      default: 'MMM YYYY'
    }
  },
  data () {
    return {
      width: 0,
      tickWidth: 100,
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
      return keyBy(this.filteredData, 'label')
    },
    xScale () {
      const labels = this.initialData.map((datum) => new Date(datum.label))
      return d3.scaleTime()
        .range([0, this.width])
        .domain(d3.extent(labels))
    },
    yScale () {
      const values = this.initialData.map((datum) => datum.value)
      return d3.scaleLinear()
        .rangeRound([this.innerHeight, 0])
        .domain([0, d3.max(values)])
    },
    area () {
      return d3.area()
        .curve(d3.curveMonotoneX)
        .x((datum) => this.xScale(new Date(datum.label)))
        .y0(this.innerHeight)
        .y1((datum) => this.yScale(datum.value))
    },
    tickCount () {
      return Math.round(this.width / this.tickWidth)
    }
  },
  mounted () {
    window.addEventListener('resize', this.updateWidth)
    this.updateWidth() // refs are not available in `data`

    d3.select(this.$refs.areas)
      .call(d3.brushX().on('end', this.onBrush))
  },
  unmounted () {
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
      const selection = d3.brushSelection(this.$refs.areas)
      let expression
      if (selection) {
        const [minDate, maxDate] = selection.map((item) => this.xScale.invert(item))
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
    },
    onMouseMove (event) {
      const hoverDate = this.xScale.invert(event.offsetX)
      this.focusDatum = this.getNearestDatum(hoverDate)
    },
    getNearestDatum (date) {
      const getBisectedIndex = d3.bisector((datum) => new Date(datum.label)).left
      const bisectedIndex = getBisectedIndex(this.initialData, date, 1)

      const leftDatum = this.initialData[bisectedIndex - 1]
      const rightDatum = this.initialData[bisectedIndex]

      if (!rightDatum) return leftDatum // will occur at right edge of scale

      const leftDate = leftDatum.label
      const rightDate = rightDatum.label
      return ((date - leftDate) > (rightDate - date))
        ? rightDatum
        : leftDatum
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../styles/_variables.sass';

.chart {
  .area {
    stroke-width: 1.5;
    transition: d 0.3s ease-out;

    &.active {
      fill: $chart-fill-active;
      stroke: $chart-stroke-active;
    }

    &.inactive {
      fill: $chart-fill-filtered;
      stroke: $chart-stroke-filtered;
    }
  }

  .axis {
    text-anchor: middle;

    line {
      stroke: #000;
    }

    text {
      fill: #000;
    }
  }

  .focus {
    circle {
      stroke: $chart-stroke-active;
    }

    .tooltip {
      width: 150px;
      background-color: rgba(0, 0, 0, 0.5);
      color: #fff;
      padding: 10px;
      margin: 5px;

      p {
        line-height: 1em;
      }
    }

    line {
      stroke: $chart-stroke-active;
      stroke-dasharray: 5,5;
    }
  }
}
</style>
