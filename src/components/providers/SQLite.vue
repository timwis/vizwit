<template>
  <div>
    <slot
      :initialData="initialData"
      :filteredData="filteredData"/>
  </div>
</template>

<script>
import squel from 'squel'
import { spawn, Worker } from 'threads'
import { initBackend } from 'absurd-sql/dist/indexeddb-main-thread'

export default {
  props: {
    filters: {
      type: Object,
      default: () => {}
    },
    dataset: {
      type: String,
      required: true
    },
    groupBy: {
      type: String,
      required: true
    },
    triggerField: {
      type: String,
      default: null
    },
    order: {
      type: String,
      default: null
    }
  },
  data () {
    return {
      worker: null,
      initialData: [],
      filteredData: []
    }
  },
  computed: {
    filtersArray () {
      return Object.values(this.filters)
    }
  },
  watch: {
    filtersArray: {
      handler: 'getFilteredData',
      deep: true
    }
  },
  async created () {
    this.worker = await initWorker()
    this.getInitialData()
  },
  methods: {
    async getInitialData () {
      setTimeout(async () => {
        const sql = constructQuery(this.$props)
        const response = await this.worker.query(sql)
        this.initialData = valuesToObjects(response[0].columns, response[0].values)
      }, 500)
    },
    async getFilteredData () {
      if (this.filtersArray.length === 0) {
        this.filteredData = []
      } else {
        const sql = constructQuery(this.$props, this.filtersArray)
        const response = await this.worker.query(sql)
        this.filteredData = valuesToObjects(response[0].columns, response[0].values)
      }
    }
  }
}

async function initWorker () {
  const worker = new Worker(new URL('../../index.worker.js', import.meta.url))
  const thread = await spawn(worker)
  initBackend(worker)
  return thread
}

function valuesToObjects (columns, rows) {
  return rows.map((row) => {
    return row.reduce((obj, value, index) => {
      const column = columns[index]
      obj[column] = value
      return obj
    }, {})
  })
}

function constructQuery (config, filtersArray = []) {
  const query = squel.select().from(config.dataset)
  const baseFilters = config.baseFilters || []
  const combinedFilters = baseFilters.concat(filtersArray)

  if (config.valueField || config.aggregateFunction || config.groupBy) {
    if (config.valueField) {
      // If valueField specified, use it as the value
      query.field(`${config.valueField} as value`)
    } else {
      // Otherwise use the aggregateFunction / aggregateField as the value
      const aggregateFunction = config.aggregateFunction || 'count'
      const aggregateField = config.aggregateField || '*'
      query.field(`${aggregateFunction}(${aggregateField}) as value`)
    }

    if (config.groupBy) {
      query.field(`${config.groupBy} as label`)
        .group(config.groupBy)

      // Order by (only if there will be multiple results)
      if (config.order) {
        query.order(config.order, '')
      } else {
        query.order('value', false)
      }
    }
  } else {
    // No aggregation specified
    if (config.offset) query.offset(config.offset)
    if (config.order) query.order(config.order, '')
  }

  // Where
  if (combinedFilters.length > 0) {
    const where = combinedFilters.map((filter) => {
      return parseExpression(filter.field, filter.expression)
    })
    query.where(where.join(' and '))
  }

  return query.toString()
}

function parseExpression (field, expression) { // todo: move to shared module
  if (expression.type === 'and' || expression.type === 'or') {
    return [
      parseExpression(field, expression.value[0]),
      expression.type,
      parseExpression(field, expression.value[1])
    ].join(' ')
  } else if (expression.type === 'in' || expression.type === 'not in') {
    return [
      field,
      expression.type,
      '(' + expression.value.map(enclose).join(', ') + ')'
    ].join(' ')
  } else {
    return [
      field,
      expression.type,
      enclose(expression.value)
    ].join(' ')
  }
}

function enclose (val) {
  if (typeof val === 'string' && val != 'true' && val != 'false') { // eslint-disable-line
    return "'" + val + "'"
  } else if (val === null) {
    return 'null'
  } else {
    return val
  }
}
</script>
