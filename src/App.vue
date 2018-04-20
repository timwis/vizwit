<template>
  <main>
    <Widget
      :filters="filters"
      title="Crimes by date"
      chart-type="datetime"
      provider="carto"
      domain="timwis.carto.com"
      dataset="crimes_2015_to_oct_2016"
      group-by="date_trunc('month', dispatch_date)"
      trigger-field="dispatch_date"
      order="label"
      @filter="onFilter"/>
    <Widget
      :filters="filters"
      title="General crime category"
      chart-type="bar"
      provider="carto"
      domain="timwis.carto.com"
      dataset="crimes_2015_to_oct_2016"
      group-by="text_general_code"
      @filter="onFilter"/>
    <Widget
      :filters="filters"
      title="Police district"
      chart-type="bar"
      provider="carto"
      domain="timwis.carto.com"
      dataset="crimes_2015_to_oct_2016"
      group-by="dc_dist"
      @filter="onFilter"/>
  </main>
</template>

<script>
import Vue from 'vue'
import Widget from './components/Widget'

export default {
  components: {
    Widget
  },
  data () {
    return {
      filters: {}
    }
  },
  methods: {
    onFilter (filter) {
      if (filter.expression) {
        console.log('setting filter', filter)
        Vue.set(this.filters, filter.field, filter)
      } else {
        Vue.delete(this.filters, filter.field)
      }
    }
  }
}
</script>
