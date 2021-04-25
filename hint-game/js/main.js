window.addEventListener(
  "load",
  function () {
    const manageBtn = document.getElementById("manage-game");
    const cardFieldContainer = document.getElementById("card-field-container");
    const itemField = document.getElementById("items-field");
    const draggableArea = document.getElementById("draggable-area");
    const minutes = document.getElementById("minutes");
    const seconds = document.getElementById("seconds");
    const label = document.querySelectorAll("label");
    const complexitySettings = document.getElementById("complexity-settings");
    const complexity = document.getElementById("complexity");
    const results = document.getElementById("results");
    const rules = document.getElementById("rules");
    const instructions = document.getElementById("instructions");
    const logo = document.getElementById("logo");
    const collections = document.getElementById("collections");
    const collectionsList = document.getElementById("collections-list");
    const spinner = document.getElementById('loader');

    const proxyUrl = "https://cors-anywhere.herokuapp.com/";

    const activeCollectionsAPI =
      "http://memorygames.pythonanywhere.com/api/v1/hints/collection/active/";

    const collectionAPI =
      "https://memorygames.pythonanywhere.com/api/v1/hints/collection/images/";

    let complexityPoints = 9;
    let guessed = 0;
    let hints = 0;
    let cardsListeners = [];
    let answers = [];
    let timeForRemembering = "";
    let timer;
    let chosenCollection = 1;
    let activeCollectionsArray = [];
    let collectionsDataArray = [];

    const createNewElement = (className, tag = "div") => {
      const newTag = document.createElement(tag);
      newTag.classList.add(className);
      return newTag;
    };

    const getActiveCollections = async () => {
      const activeCollections = fetch(/* proxyUrl +  */activeCollectionsAPI)
        .then((response) => response.json())
        .then((data) => data)
        .catch((error) => {
          alert('При получении данных возникла ошибка: ' + error);
        });
      return activeCollections;
    };

    const toCheck = (event) => {
      if (event.target != event.currentTarget) {
        const children = event.currentTarget.getElementsByClassName(
          "collection-item"
        );
        for (let i = 0; i < children.length; i++) {
          children[i].classList.remove("collection-checked");
        }

        event.target.classList.add("collection-checked");
        chosenCollection = event.target.id;
      }
    };

    const createCollections = async () => {
      const activeCollections = activeCollectionsArray.length ? activeCollectionsArray : await getActiveCollections();
      if (activeCollections) {
        activeCollectionsArray = [...activeCollections];
        chosenCollection = activeCollectionsArray[0].id;
        spinner.classList.add("hidden");
        collections.classList.remove("hidden");
        const fragment = document.createDocumentFragment();
        activeCollections.forEach((data) => {
          const collectionItem = createNewElement("collection-item");
          const collectionItemName = createNewElement("collection-name", "p");
          const collectionItemDescription = createNewElement(
            "collection-description",
            "p"
          );

          collectionItem.appendChild(collectionItemName);
          collectionItem.appendChild(collectionItemDescription);
          collectionItem.id = data.id;
          collectionItemName.textContent = data.name;
          collectionItemDescription.textContent = data.description;

          fragment.appendChild(collectionItem);
          return fragment;
        });

        collectionsList.appendChild(fragment);
        collectionsList
          .getElementsByClassName("collection-item")[0]
          .classList.add("collection-checked");

        collectionsList.addEventListener("click", toCheck, false);
        startListeners();
      }
    };

    const startListeners = () => {
      complexity.addEventListener("click", showComplexity, false);
      rules.addEventListener("click", showRules, false);
      logo.addEventListener("click", goToMainScreen, false);
      manageBtn.addEventListener("click", startGame, false);
    };

    createCollections();

    const showComplexity = (e) => {
      results.classList.add("hidden");
      instructions.classList.add("hidden");
      collections.classList.add("hidden");
      complexitySettings.classList.remove("hidden");
    };

    const showRules = (e) => {
      complexitySettings.classList.add("hidden");
      results.classList.add("hidden");
      collections.classList.add("hidden");
      instructions.classList.remove("hidden");
    };

    const createComplexityStar = (n) => {
      $("#complexity").empty();
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < n; i++) {
        const image = createNewElement("complexity-img", "img");
        image.src = "images/star-yellow.png";
        fragment.appendChild(image);
      }
      complexity.appendChild(fragment);
    };

    const changeComplexity = (e) => {
      const attr = e.target.getAttribute("for");
      if (attr === "easy") {
        createComplexityStar(1);
        complexityPoints = 9;
      } else if (attr === "hard") {
        createComplexityStar(2);
        complexityPoints = 18;
      }
    };

    label.forEach((item) =>
      item.addEventListener("click", changeComplexity, false)
    );

    const shuffleArray = (array) => {
      const result = [].concat(array);
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    function ItemBlock(n, isHint = false) {
      this.item = createNewElement("item");
      this.item.id = `droppable-area-${n}`;
      this.itemImage = createNewElement("item-image");
      this.itemImage.id = `item-image-${n}`;
      this.itemName = createNewElement("item-name", "input");
      this.itemName.id = `item-name-${n}`;

      if (isHint) {
        this.hint = createNewElement("item-hint", "img");
        this.hint.src = "images/hint.png";
        this.item.appendChild(this.hint);
        this.item.classList.add("item-with-hint");

        $(".item-image").attr({
          ondrag: "return false",
          ondragdrop: "return false",
          ondragstart: "return false",
        });

        $(".item-hint").attr({
          ondrag: "return false",
          ondragdrop: "return false",
          ondragstart: "return false",
        });
      }

      this.item.appendChild(this.itemImage);
      this.item.appendChild(this.itemName);
    }

    const getCollectionData = async () => {
      const currentCollection = await fetch(/* proxyUrl +  */collectionAPI + chosenCollection)
        .then(response => response.json())
        .then(data => data)
        .catch((error) => {
          alert('При получении данных возникла ошибка: ' + error);
        });
      return currentCollection;
    };


    const getRandomItems = async (count) => {
      let collectionData;
      if (!collectionsDataArray[chosenCollection] || collectionsDataArray[chosenCollection].length < 18) {
        collectionData = await getCollectionData();
        collectionsDataArray[chosenCollection] = collectionData;
      } else {
        collectionData = collectionsDataArray[chosenCollection];
      }

      const keys = Object.keys(collectionData);
      const keyArray = [];
      const valueArray = [];

      while (keyArray.length < count) {
        const objectNumber = Math.floor(Math.random() * keys.length);
        const key = collectionData[objectNumber].name;
        if (keyArray.indexOf(key) === -1) {
          const value = collectionData[objectNumber].url;
          keyArray.push(key);
          valueArray.push(value);
        }
      }

      if (count === 18) {
        while (valueArray.length < count + 3) {
          const objectNumber = Math.floor(Math.random() * keys.length);
          const key = collectionData[objectNumber].url;
          if (valueArray.indexOf(key) === -1) {
            valueArray.push(collectionData[objectNumber].url);
          }
        }
      }

      return {
        keys: shuffleArray(keyArray),
        values: shuffleArray(valueArray),
      };
    };


    function Image(image) {
      this.image = createNewElement("random-img", "img");
      this.image.src = image;
      this.image.setAttribute("data-value", "card");
    }

    const generateCardItems = async (count) => {
      logo.removeEventListener("click", goToMainScreen, false);
      complexity.removeEventListener("click", showComplexity, false);
      rules.removeEventListener("click", showRules, false);
      spinner.classList.remove("hidden");
      const fragment = document.createDocumentFragment();
      const randomItems = await getRandomItems(count);
      spinner.classList.add("hidden");
      logo.addEventListener("click", goToMainScreen, false);
      complexity.addEventListener("click", showComplexity, false);
      rules.addEventListener("click", showRules, false);
      for (let i = 0; i < count; i++) {
        const card = new ItemBlock(i);
        itemField.appendChild(card.item);
        card.itemName.value = randomItems.keys[i];
        card.itemName.setAttribute("disabled", true);
        const image = new Image(randomItems.values[i]);
        fragment.appendChild(image.image);

        $(`#droppable-area-${i}`).droppable({
          drop: function (event, ui) {
            $child = $(`#item-image-${i}`).children()[0];
            if ($child) {
              $("#draggable-area").append($child);
            }
            accept: 'img[data-value="card"]',
              $(`#item-image-${i}`).append(ui.draggable);
          },
        });
      }

      if (count === 18) {
        for (let i = 0; i < 3; i++) {
          const image = new Image(randomItems.values[count + i]);
          fragment.appendChild(image.image);
        }
      }

      draggableArea.appendChild(fragment);

      $("#draggable-area img").draggable({
        helper: "clone",
        cursor: "crosshair",
      });


      $("#draggable-area").droppable({
        drop: function (event, ui) {
          accept: 'img[data-value="card"]',
            $("#draggable-area").append(ui.draggable);
        },
      });
    };

    const startTimer = () => {
      let countSeconds = -1;
      let countMinutes = 0;

      function updateTimer() {
        countSeconds += 1;

        if (countSeconds === 60) {
          countSeconds = 0;
          countMinutes += 1;
          if (countMinutes === 60) {
            clearTimeout(timer);
            return;
          }
          if (countMinutes < 10) {
            minutes.textContent = "0" + countMinutes;
          } else {
            minutes.textContent = countMinutes;
          }
        }

        if (countSeconds < 10) {
          seconds.textContent = "0" + countSeconds;
        } else {
          seconds.textContent = countSeconds;
        }
        timer = setTimeout(updateTimer, 1000);
      }
      updateTimer();
    };

    const getAnswer = () => {
      const items = $(".item");
      const len = items.length;
      for (let i = 0; i < len; i++) {
        const url = items[i].getElementsByClassName("random-img")[0].src;
        const text = items[i].children[1].value;
        const image = url;
        answers[items[i].id] = {
          text,
          image,
        };
      }
    };

    const checkValue = (e) => {
      const id = e.target.parentNode.id;
      const value = e.target.value;
      const reg = new RegExp(`^${value}`, "i");

      const isMatched = reg.test(answers[id].text);

      if (!isMatched) {
        e.target.value = "";
        e.target.placeholder = "неправильно";
      }
      if (isMatched && value.length >= 3) {
        e.target.value = answers[id].text;
        e.target.setAttribute("disabled", true);
        e.target.parentNode.classList.add("right");
        e.target.parentNode.firstElementChild.classList.add("hidden");
        guessed += 1;
      }
    };

    const executeHint = (e) => {
      const id = e.target.parentNode.id;
      const input = e.target.parentNode.lastElementChild;
      input.value = answers[id].text;
      input.setAttribute("disabled", true);
      e.target.parentNode.classList.add("prompted");
      e.target.classList.add("hidden");
      hints += 1;
    };

    const checkAnswers = () => {
      manageBtn.removeEventListener("click", checkAnswers, false);
      clearTimeout(timer);
      manageBtn.textContent = "Начать игру";
      $("#all-answers").text(guessed + hints);
      $("#right-answers").text(guessed);
      $(".all-cards-count").text(complexityPoints);
      $("#hints-count").text(hints);
      $("#whole-game-time").text(
        `${minutes.textContent} : ${seconds.textContent}`
      );
      $("#time-for-remember").text(timeForRemembering);
      $(".timer").removeClass("visible");
      $(".options").removeClass("hidden");
      $(".item-hint").removeClass("item-with-hint");
      cardsListeners.forEach((element) => {
        element.itemName.removeEventListener("keyup", checkValue);
        element.hint.removeEventListener("click", executeHint);
      });

      answers = [];
      cardsListeners.length = 0;

      $("#draggable-area").empty();
      $("#items-field").empty();
      cardFieldContainer.classList.add("hidden");
      results.classList.remove("hidden");

      manageBtn.addEventListener("click", startGame, false);
    };

    const showImages = () => {
      manageBtn.textContent = "Проверить";
      manageBtn.addEventListener("click", checkAnswers, false);
      const keys = [];
      for (let key in answers) {
        keys.push(key);
      }
      const shuffledKeys = shuffleArray(keys);

      const count = keys.length;
      $("#draggable-area").empty();
      $("#items-field").empty();

      for (let i = 0; i < count; i++) {
        const num = shuffledKeys[i].split("-")[2];
        const card = new ItemBlock(num, true);
        itemField.appendChild(card.item);
        card.itemName.addEventListener("keyup", checkValue, false);
        card.hint.addEventListener("click", executeHint, false);
        cardsListeners.push(card);

        const image = new Image(answers[shuffledKeys[i]]["image"]);
        card.itemImage.appendChild(image.image);
      }
    };

    class DomNode {
      constructor(node) {
        this.element = document.createElement(node);
      }

      addClass(classList) {
        this.element.classList.add(classList);
        return this.element;
      }
    }

    class ModalWindow {
      constructor(parent, message) {
        if (!!ModalWindow.instance) {
          return ModalWindow.instance;
        }

        ModalWindow.instance = this;

        this.parent = parent;
        this.message = message;
        this.modal = new DomNode("modal").addClass("modal");
        this.modalContent = new DomNode("section").addClass("modal-content");
        this.modalHeader = new DomNode("div").addClass("modal-header");
        this.modalClose = new DomNode("button").addClass("modal-close");
        this.modalHeaderText = new DomNode("h2").addClass("modal-header-text");
        this.modalBody = new DomNode("div").addClass("modal-body");
        this.modalBodyText = new DomNode("p").addClass("modal-body-text");

        return this;
      }

      create() {
        this.appendNodes().setAttributes();
        this.parent.appendChild(this.modal);
        return this;
      }

      appendNodes() {
        this.modalHeader.appendChild(this.modalHeaderText);
        this.modalBody.appendChild(this.modalClose);
        this.modalContent.appendChild(this.modalHeader);
        this.modalContent.appendChild(this.modalBody);
        this.modal.appendChild(this.modalContent);
        return this;
      }

      setAttributes() {
        this.modalHeaderText.textContent = `${this.message}`;
        this.modalClose.textContent = "Ok";
        return this;
      }
    }

    class ModalWindowController {
      constructor(parent, message) {
        this.parent = parent;
        this.message = message;
        this.modal = new ModalWindow(this.parent, this.message).create();
        this.listenClose = this.closeModal.bind(null, this);
        this.modal.modalClose.addEventListener(
          "click",
          this.listenClose,
          false
        );
      }

      closeModal(that, event) {
        that.modal.modalClose.removeEventListener("click", that.listenClose);
        that.parent.removeChild(that.modal.modal);
      }
    }

    const rememberItems = (e) => {
      if (
        (complexityPoints === 9 &&
          $("#draggable-area").children().length > 0) ||
        (complexityPoints === 18 && $("#draggable-area").children().length > 3)
      ) {
        return new ModalWindowController(
          document.body,
          "Необходимо соотнести все картинки с карточками!"
        );
      }
      getAnswer();
      $(".item").animate({ opacity: 0 }, 500);
      setTimeout(showImages, 500);
      timeForRemembering = `${minutes.textContent} : ${seconds.textContent}`;
      manageBtn.removeEventListener("click", rememberItems);
    };

    const startGame = async (e) => {
      manageBtn.removeEventListener("click", startGame, false);
      collections.classList.add("hidden");
      complexitySettings.classList.add("hidden");
      instructions.classList.add("hidden");
      results.classList.add("hidden");
      cardFieldContainer.classList.remove("hidden");
      guessed = 0;
      hints = 0;

      await generateCardItems(complexityPoints);

      clearTimeout(timer);
      manageBtn.textContent = "Запомнить";
      manageBtn.addEventListener("click", rememberItems, false);
      $(".options").addClass("hidden");
      $(".timer").addClass("visible");
      minutes.textContent = "00";
      startTimer();
    };

    const goToMainScreen = (e) => {
      manageBtn.removeEventListener("click", goToMainScreen, false);
      manageBtn.removeEventListener("click", rememberItems, false);
      manageBtn.removeEventListener("click", checkAnswers, false);
      clearTimeout(timer);
      manageBtn.textContent = "Начать игру";

      $(".timer").removeClass("visible");
      $(".options").removeClass("hidden");
      $(".item-hint").removeClass("item-with-hint");
      cardsListeners.forEach((element) => {
        element.itemName.removeEventListener("keyup", checkValue);
        element.hint.removeEventListener("click", executeHint);
      });

      answers = [];
      cardsListeners.length = 0;

      $("#draggable-area").empty();
      $("#items-field").empty();
      cardFieldContainer.classList.add("hidden");
      complexitySettings.classList.add("hidden");
      instructions.classList.add("hidden");
      results.classList.add("hidden");
      collections.classList.remove("hidden");

      manageBtn.addEventListener("click", startGame, false);
    };

  },

  false
);
