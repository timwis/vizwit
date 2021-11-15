<template>
  <main>
    <Widget
      :filters="filters"
      title="Crimes by date"
      chart-type="datetime"
      provider="sqlite"
      dataset="crimes"
      group-by="substr(dispatch_date_time, 1, 7)"
      trigger-field="dispatch_date_time"
      order="label"
      @filter="onFilter"/>
    <Widget
      :filters="filters"
      title="General crime category"
      chart-type="bar"
      provider="sqlite"
      dataset="crimes"
      group-by="text_general_code"
      @filter="onFilter"/>
    <Widget
      :filters="filters"
      title="Police district"
      chart-type="bar"
      provider="sqlite"
      dataset="crimes"
      group-by="dc_dist"
      @filter="onFilter"/>
  </main>
</template>

<script>
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
        this.filters[filter.field] = filter
      } else {
        delete this.filters[filter.field]
      }
    }
  }
}
</script>
