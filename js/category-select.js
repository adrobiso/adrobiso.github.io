fetch('data/categories.json')
  .then(response => { return response.json(); })
  .then(jsonData => init(jsonData));

function init(jsonData) {
  createCategoryElements(jsonData);
}

function createCategoryElements(categories) {
  const categoryBox = document.getElementById('categoryBox');
  for (let category in categories) {
    const linkElement = document.createElement('a');
    linkElement.href = "practice.html?category=" + category;
    const imageElement = document.createElement('img');
    imageElement.src = categories[category].iconSrc;
    imageElement.classList.add('categoryImage');
    linkElement.appendChild(imageElement);
    categoryBox.appendChild(linkElement);
  }
}