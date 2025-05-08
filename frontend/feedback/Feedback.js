class Feedback {
  constructor(containerId, productId) {
    this.container = document.getElementById(containerId);
    this.productId = productId;
    this.token = localStorage.getItem('token');
    this.init();
  }

  async init() {
    await this.loadFeedback();
    this.render();
  }

  async loadFeedback() {
    try {
      const response = await fetch(`http://localhost:5000/api/feedback/product/${this.productId}`);
      if (!response.ok) throw new Error('Failed to load feedback');
      this.feedback = await response.json();
    } catch (error) {
      console.error('Error loading feedback:', error);
      this.feedback = [];
    }
  }

  async submitFeedback(rating, comment) {
    try {
      const response = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          productId: this.productId,
          rating,
          comment
        })
      });

      if (!response.ok) throw new Error('Failed to submit feedback');
      
      await this.loadFeedback();
      this.render();
      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  }

  render() {
    const averageRating = this.feedback.length > 0
      ? this.feedback.reduce((acc, f) => acc + f.rating, 0) / this.feedback.length
      : 0;

    this.container.innerHTML = `
      <div class="feedback-container">
        <h3>Customer Feedback</h3>
        <div class="average-rating">
          <span class="rating">${averageRating.toFixed(1)}</span>
          <div class="stars">
            ${this.renderStars(averageRating)}
          </div>
          <span class="total-reviews">(${this.feedback.length} reviews)</span>
        </div>

        <div class="feedback-form">
          <h4>Write a Review</h4>
          <div class="rating-input">
            ${this.renderRatingInput()}
          </div>
          <textarea id="feedbackComment" placeholder="Write your review here..."></textarea>
          <button onclick="feedback.submitFeedback()">Submit Review</button>
        </div>

        <div class="feedback-list">
          ${this.feedback.map(f => this.renderFeedbackItem(f)).join('')}
        </div>
      </div>
    `;
  }

  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return `
      ${'★'.repeat(fullStars)}
      ${halfStar ? '★' : ''}
      ${'☆'.repeat(emptyStars)}
    `;
  }

  renderRatingInput() {
    return `
      <div class="star-rating">
        ${[5, 4, 3, 2, 1].map(rating => `
          <input type="radio" id="star${rating}" name="rating" value="${rating}">
          <label for="star${rating}">★</label>
        `).join('')}
      </div>
    `;
  }

  renderFeedbackItem(feedback) {
    return `
      <div class="feedback-item">
        <div class="feedback-header">
          <span class="customer-name">${feedback.customer.name}</span>
          <div class="stars">${this.renderStars(feedback.rating)}</div>
          <span class="date">${new Date(feedback.createdAt).toLocaleDateString()}</span>
        </div>
        <p class="comment">${feedback.comment}</p>
      </div>
    `;
  }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
  .feedback-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .average-rating {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .rating {
    font-size: 24px;
    font-weight: bold;
  }

  .stars {
    color: #ffd700;
  }

  .feedback-form {
    margin: 20px 0;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
  }

  .rating-input {
    margin-bottom: 10px;
  }

  .star-rating {
    display: flex;
    flex-direction: row-reverse;
    gap: 5px;
  }

  .star-rating input {
    display: none;
  }

  .star-rating label {
    cursor: pointer;
    font-size: 24px;
    color: #ddd;
  }

  .star-rating input:checked ~ label,
  .star-rating label:hover,
  .star-rating label:hover ~ label {
    color: #ffd700;
  }

  textarea {
    width: 100%;
    min-height: 100px;
    margin: 10px 0;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  button {
    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background-color: #45a049;
  }

  .feedback-list {
    margin-top: 20px;
  }

  .feedback-item {
    padding: 15px;
    border-bottom: 1px solid #ddd;
  }

  .feedback-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .customer-name {
    font-weight: bold;
  }

  .date {
    color: #666;
    font-size: 0.9em;
  }

  .comment {
    margin: 0;
    line-height: 1.5;
  }
`;

document.head.appendChild(style);

// Export for use in other files
window.Feedback = Feedback; 