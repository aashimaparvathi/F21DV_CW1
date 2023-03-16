/* Using for styling the scroll to slide to next div on button click*/

const showMapButton = document.getElementById("show-map-button");
const mapBubbleLineContainer = document.querySelector(
  ".map-bubble-line-container"
);

showMapButton.addEventListener("click", () => {
  mapBubbleLineContainer.style.display = "block";
  window.scrollTo({
    top: mapBubbleLineContainer.offsetTop,
    behavior: "smooth",
  });
});

const showNextButton = document.getElementById("show-next-button");
const heatmapContainer = document.querySelector(".heatmap-container");

showNextButton.addEventListener("click", () => {
  heatmapContainer.style.display = "block";
  window.scrollTo({
    top: heatmapContainer.offsetTop,
    behavior: "smooth",
  });
});

const showSummaryButton = document.getElementById("show-summary-button");
const summaryContainer = document.querySelector(".first-summary-container");

showSummaryButton.addEventListener("click", () => {
  summaryContainer.style.display = "block";
  window.scrollTo({
    top: summaryContainer.offsetTop,
    behavior: "smooth",
  });
});

const showClusterButton = document.getElementById("show-cluster-button");
const clusterContainer = document.querySelector(".scatter-container");

showClusterButton.addEventListener("click", () => {
  clusterContainer.style.display = "block";
  window.scrollTo({
    top: clusterContainer.offsetTop,
    behavior: "smooth",
  });
});

const showConclusionsButton = document.getElementById(
  "show-conclusions-button"
);
const conclusionsContainer = document.querySelector(".conclusions-container");

showConclusionsButton.addEventListener("click", () => {
  conclusionsContainer.style.display = "block";
  window.scrollTo({
    top: conclusionsContainer.offsetTop,
    behavior: "smooth",
  });
});
