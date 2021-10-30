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

export default (_context, inject) => {
  inject('dateFormat', dateFormat)
  inject('timeFormat', timeFormat)
}
