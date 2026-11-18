const form = document.querySelector('#dish-form')
const fields = document.querySelector('#dish-fields')
const inputs = form.elements
const heading = document.querySelector('#editor-title')
const save = document.querySelector('#save')
const cancel = document.querySelector('#cancel')
const message = document.querySelector('#message')
const retry = document.querySelector('#retry')
const list = document.querySelector('#dish-list')
const count = document.querySelector('#dish-count')
const empty = document.querySelector('#empty')
const menuTitle = document.querySelector('#menu-title')
const template = document.querySelector('#dish-template')
const currency = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })
const endpoint = '/api/dishes'

let dishes = []
let editingId = null
let loaded = false
let busy = false

async function requestMenu(path, options) {
  let response
  try {
    response = await fetch(path, options)
  } catch {
    throw new Error('Could not reach the server. Check that it is running and try again.')
  }
  if (response.status === 204) return
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'The server rejected the request.')
  return data
}

function announce(text, isError = false) {
  message.textContent = text
  message.dataset.error = String(isError)
}

function syncControls() {
  fields.disabled = busy || !loaded
  retry.disabled = busy
  for (const button of list.querySelectorAll('button')) {
    button.disabled = busy
  }
}

function renderDishes() {
  const cards = dishes.map(dish => {
    const card = template.content.firstElementChild.cloneNode(true)
    card.querySelector('.dish-category').textContent = dish.category
    card.querySelector('.dish-name').textContent = dish.name
    const description = card.querySelector('.dish-description')
    description.textContent = dish.description
    description.hidden = !dish.description
    card.querySelector('.dish-price').textContent = currency.format(dish.priceCents / 100)

    const editButton = card.querySelector('.edit')
    editButton.setAttribute('aria-label', 'Edit ' + dish.name)
    editButton.addEventListener('click', () => editDish(dish))

    const removeButton = card.querySelector('.remove')
    removeButton.setAttribute('aria-label', 'Remove ' + dish.name)
    removeButton.addEventListener('click', () => removeDish(dish))
    return card
  })

  list.replaceChildren(...cards)
  count.textContent = dishes.length === 1 ? '1 dish' : dishes.length + ' dishes'
  empty.textContent = 'The menu is empty. Add a dish to get started.'
  empty.hidden = dishes.length > 0
}

async function loadDishes() {
  busy = true
  syncControls()
  announce('')
  empty.textContent = 'Loading dishes…'

  try {
    dishes = await requestMenu(endpoint)
    loaded = true
    retry.hidden = true
    renderDishes()
  } catch (error) {
    empty.textContent = 'The menu could not be loaded.'
    announce(error.message, true)
    retry.hidden = false
  } finally {
    busy = false
    syncControls()
  }
}

function resetEditor() {
  editingId = null
  form.reset()
  heading.textContent = 'Add a dish'
  save.textContent = 'Add dish'
  cancel.hidden = true
}

function editDish(dish) {
  editingId = dish.id
  inputs.name.value = dish.name
  inputs.category.value = dish.category
  inputs.price.value = (dish.priceCents / 100).toFixed(2)
  inputs.description.value = dish.description
  heading.textContent = 'Edit dish'
  save.textContent = 'Save changes'
  cancel.hidden = false
  announce('')
  inputs.name.focus()
}

async function saveDish(event) {
  event.preventDefault()
  if (busy || !loaded) return

  const formData = new FormData(form)
  const name = formData.get('name').trim()
  if (!name) {
    announce('Enter a dish name.', true)
    inputs.name.focus()
    return
  }

  const dish = {
    name,
    category: formData.get('category'),
    priceCents: Math.round(Number(formData.get('price')) * 100),
    description: formData.get('description').trim()
  }

  const id = editingId
  let saved = false
  busy = true
  syncControls()
  announce(id ? 'Saving changes…' : 'Adding dish…')

  try {
    const result = await requestMenu(id ? endpoint + '/' + id : endpoint, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dish)
    })
    dishes = id ? dishes.map(item => item.id === id ? result : item) : [result, ...dishes]
    renderDishes()
    resetEditor()
    announce(result.name + (id ? ' updated.' : ' added.'))
    saved = true
  } catch (error) {
    announce(error.message, true)
  } finally {
    busy = false
    syncControls()
    if (saved) inputs.name.focus()
    else save.focus()
  }
}

async function removeDish(dish) {
  if (busy || !window.confirm('Remove ' + dish.name + ' from the menu?')) return

  busy = true
  syncControls()
  announce('Removing dish…')
  try {
    await requestMenu(endpoint + '/' + dish.id, { method: 'DELETE' })
    dishes = dishes.filter(item => item.id !== dish.id)
    if (editingId === dish.id) resetEditor()
    renderDishes()
    menuTitle.focus()
    announce(dish.name + ' removed.')
  } catch (error) {
    announce(error.message, true)
  } finally {
    busy = false
    syncControls()
  }
}

form.addEventListener('submit', saveDish)
cancel.addEventListener('click', () => {
  resetEditor()
  announce('Edit cancelled.')
  inputs.name.focus()
})
retry.addEventListener('click', loadDishes)
loadDishes()
