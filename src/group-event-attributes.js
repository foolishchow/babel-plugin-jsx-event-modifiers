const TSXMODIFIER = /^([0-9a-zA-Z]+\-?[0-9a-zA-Z]+)((\-\-[0-9a-zA-Z]+)+)$/
export default (t, options = {}) => (obj, attribute) => {
  if (t.isJSXSpreadAttribute(attribute)) {
    return obj
  }

  const isNamespaced = t.isJSXNamespacedName(attribute.get('name'))
  let event = null;
  let modifiers = null;

  // const event = (isNamespaced ? attribute.get('name').get('namespace') : attribute.get('name')).get('name').node
  // const modifiers = isNamespaced ? new Set(attribute.get('name').get('name').get('name').node.split('-')) : new Set()

  if (isNamespaced) {
    event = attribute.get('name').get('namespace').get('name').node;
    modifiers = new Set(attribute.get('name').get('name').get('name').node.split('-'))
  } else {
    //allow on-click--modifier1--modifer2
    /* var a = 'on-click--modifier1--modifer2'
     var b = 'on-click--modifier1--modifer2--modifier3'
      console.info(a.match(reg))
      console.info(b.match(reg))
     */
    let total = attribute.get('name').get('name').node;

    if (TSXMODIFIER.test(total)) {
      let matched = total.match(TSXMODIFIER);
      event = matched[1]
      modifiers = new Set(matched[2].replace(/^\-\-/, '').split('--'))
    } else {
      event = total;
      modifiers = new Set()
    }
  }

  if (event.indexOf('on') !== 0) {
    return obj
  }

  const value = attribute.get('value')

  attribute.remove()
  if (!t.isJSXExpressionContainer(value)) {
    return obj
  }

  const expression = value.get('expression').node

  let eventName = event.substr(2)
  if (eventName[0] === '-') {
    eventName = eventName.substr(1)
  }
  eventName = eventName[0].toLowerCase() + eventName.substr(1)
  if (modifiers.has('capture')) {
    eventName = '!' + eventName
  }
  if (modifiers.has('once')) {
    eventName = '~' + eventName
  }

  if (!obj[eventName]) {
    obj[eventName] = []
  }

  obj[eventName].push({
    modifiers,
    expression,
    attribute
  })

  return obj
}
