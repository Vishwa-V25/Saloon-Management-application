import Service from '../models/Service.js';

export async function getServices(req, res) {
  try {
    const { availableOnly, category } = req.query;
    const filter = {};
    if (availableOnly === 'true') filter.isAvailable = true;
    if (category && category !== 'All') filter.category = category;

    const services = await Service.find(filter).sort({ isPopular: -1, createdAt: 1 });
    res.json({ services });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load services.' });
  }
}

export async function createService(req, res) {
  try {
    const { name, category, description, duration, price, image, isPopular, isAvailable, specialOfferText } = req.body;
    if (!name || !description || !duration || !price) {
      return res.status(400).json({ message: 'Name, description, duration, and price are required.' });
    }

    const service = await Service.create({
      name: name.trim(),
      category: category || 'Haircut & Styling',
      description: description.trim(),
      duration: Number(duration),
      price: Number(price),
      image: image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
      isPopular: Boolean(isPopular),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      specialOfferText: specialOfferText || '',
    });

    res.status(201).json({ service });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create service.' });
  }
}

export async function updateService(req, res) {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }
    res.json({ service });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update service.' });
  }
}

export async function deleteService(req, res) {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }
    res.json({ message: 'Service deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete service.' });
  }
}
