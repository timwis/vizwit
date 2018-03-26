<template>
  <main>
    <component
      v-for="widget in widgets"
      :key="widget.title"
      :is="widget.provider"
      :config="widget"
      :filters="filters">
      <component
        :is="widget.chartType"
        :initial-data="initialData"
        :filtered-data="filteredData"
        slot-scope="{ initialData, filteredData }"/>
    </component>
  </main>
</template>

<script>
import Carto from './components/providers/Carto'
import Bar from './components/charts/Bar'
import widgets from '../fixtures/config-crime-incidents.json'

export default {
  components: {
    Carto,
    Bar: Bar
  },
  data () {
    return {
      widgets,
      filters: []
    }
  },
  mounted () {
    window.setTimeout(() => {
      this.filters.push({
        field: 'dc_dist',
        expression: {
          type: '=',
          value: '15'
        }
      })
    }, 1000)
  }
}
</script>
