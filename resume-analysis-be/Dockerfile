FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Install Poppler (for PDF processing, optional)
RUN apt-get update && apt-get install -y \
    poppler-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Uvicorn
RUN pip install uvicorn

# Copy the requirements.txt file to the container
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app's source code to the container
COPY . .

# Expose port 8000
EXPOSE 80

# Start the Flask app with Gunicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "80"]