const dateFormat = (date, locales) => {
  if (date == null) { return }

  const dtf = new Intl.DateTimeFormat(locales, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return dtf.format(new Date(date))
}

const timeFormat = (time, locales) => {
  if (time == null) { return }

  const dtf = new Intl.DateTimeFormat(locales, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  return dtf.format(new Date(time))
}

const pageFirstNumber = (info) => {
  if (info == null || info.limit_value == null || info.current_page == null) { return }

  return info.limit_value * (info.current_page - 1) + 1
}

const pageLastNumber = (info) => {
  if (info == null || info.limit_value == null || info.current_page == null || info.total_pages == null || info.total_count == null) { return }

  return (info.current_page < info.total_pages) ? info.limit_value * info.current_page : info.total_count
}

export default (_context, inject) => {
  inject('dateFormat', dateFormat)
  inject('timeFormat', timeFormat)
  inject('pageFirstNumber', pageFirstNumber)
  inject('pageLastNumber', pageLastNumber)
}

export const TestPlugin = {
  install (Vue) {
    Vue.prototype.$_dateFormat = dateFormat
    Vue.prototype.$_timeFormat = timeFormat
    Vue.prototype.$_pageFirstNumber = pageFirstNumber
    Vue.prototype.$_pageLastNumber = pageLastNumber
  }
}
