const searchForm = document.getElementById("search-form");
const searchBox = document.getElementById("search-box");
const searchResult = document.getElementById("search-result");
const showMoreBtn = document.getElementById("show-more-btn");
const statusMessage = document.getElementById("status-message");

let keyword = "";
let page = 1;
let totalPages = 1;

function setStatus(text) {
  statusMessage.textContent = text;
}

function setLoading(isLoading) {
  searchForm.querySelector("button").disabled = isLoading;
  showMoreBtn.disabled = isLoading;
}

async function searchImages() {
  // Guard: no key configured (still using the sample file)
  if (!window.CONFIG || !CONFIG.UNSPLASH_ACCESS_KEY || CONFIG.UNSPLASH_ACCESS_KEY === "your-access-key-here") {
    setStatus("No API key found. Copy config.sample.js to config.js and add your real key.");
    return;
  }

  // Guard: empty search
  if (!keyword.trim()) {
    setStatus("Type something to search for.");
    return;
  }

  const url = `https://api.unsplash.com/search/photos?page=${page}&per_page=12&query=${encodeURIComponent(keyword)}&client_id=${CONFIG.UNSPLASH_ACCESS_KEY}`;

  setLoading(true);
  setStatus(page === 1 ? "Searching..." : "Loading more...");

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("API key was rejected. Check config.js.");
      }
      if (response.status === 403 || response.status === 429) {
        throw new Error("Rate limit reached. Try again later.");
      }
      throw new Error(`Request failed (status ${response.status}).`);
    }

    const data = await response.json();
    totalPages = data.total_pages || 1;
    const results = data.results || [];

    if (page === 1) {
      searchResult.innerHTML = "";
    }

    if (page === 1 && results.length === 0) {
      setStatus(`No results for "${keyword}".`);
      showMoreBtn.style.display = "none";
      return;
    }

    results.forEach((result) => {
      const card = document.createElement("div");
      card.className = "photo-card";

      const imageLink = document.createElement("a");
      imageLink.href = result.links.html;
      imageLink.target = "_blank";
      imageLink.rel = "noopener noreferrer";

      const image = document.createElement("img");
      image.src = result.urls.small;
      image.alt = result.alt_description || keyword;
      image.loading = "lazy";
      imageLink.appendChild(image);

      // Unsplash API guidelines require crediting the photographer
      const credit = document.createElement("a");
      credit.className = "credit";
      credit.href = `${result.user.links.html}?utm_source=your_app_name&utm_medium=referral`;
      credit.target = "_blank";
      credit.rel = "noopener noreferrer";
      credit.textContent = `Photo by ${result.user.name}`;

      card.appendChild(imageLink);
      card.appendChild(credit);
      searchResult.appendChild(card);
    });

    setStatus(`Showing results for "${keyword}" (page ${page} of ${totalPages}).`);
    showMoreBtn.style.display = page < totalPages ? "block" : "none";

    if (page >= totalPages) {
      setStatus(`Showing all results for "${keyword}".`);
    }
  } catch (err) {
    setStatus(err.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  keyword = searchBox.value;
  page = 1;
  searchImages();
});

showMoreBtn.addEventListener("click", () => {
  page++;
  searchImages();
});