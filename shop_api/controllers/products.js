const Product = require('../models/product');

// to chain the queries
// don't await for find() as it will give result back
// we don't want result we want queryObject
// e.g. let result=Product.find()
// then let result=result.sort()
// then let result=result.limit()
// at last we can await for products
// as const products=await result;

const getAllProductsStatic = async (req, res) => {
  const products = await Product.find({ price: { $gt: 30 } })
    .sort('price')
    .select('name price');

  res.status(200).json({ products, nbHits: products.length });
};



const getAllProducts = async (req, res) => {
  const { featured, company, name, sort, fields, numericFilters } = req.query;
  const queryObject = {};

  if (featured) {
    queryObject.featured = featured === 'true' ? true : false;
  }
  if (company) {
    queryObject.company = company;
  }
  if (name) {
    queryObject.name = { $regex: name, $options: 'i' };
  }

  // numeric filters
  if (numericFilters) {
    const operatorMap = {
      '>': '$gt',
      '>=': '$gte',
      '=': '$eq',
      '<': '$lt',
      '<=': '$lte',
    };
    const regEx = /\b(<|>|>=|=|<|<=)\b/g;
    let filters = numericFilters.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`
    );
    const options = ['price', 'rating'];
    filters = filters.split(',').forEach((item) => {
      const [field, operator, value] = item.split('-');
      if (options.includes(field)) {
        queryObject[field] = { [operator]: Number(value) };
      }
    });
  }

  let result = Product.find(queryObject);


  // sort / Note that result has no products yet it has queryObject
  if (sort) {
    const sortList = sort.split(',').join(' '); // sort takes space seperated string i.e. ('-name price') but passed as '-name,price'
    result = result.sort(sortList);
  } else {
    result = result.sort('createdAt');
  }

  // selecting columns
  if (fields) {
    const fieldsList = fields.split(',').join(' ');
    result = result.select(fieldsList);
  }


  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);
  // 23
  // 4 7 7 7 2

  const products = await result; // here finally we get products
  res.status(200).json({ products, nbHits: products.length });
};

module.exports = {
  getAllProducts,
  getAllProductsStatic,
};
