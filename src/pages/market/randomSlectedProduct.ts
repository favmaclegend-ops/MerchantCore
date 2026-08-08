import { marketStore, type MarketStoreProduct } from "./demoMarketStore";

const product = marketStore.getState().products;
const productLength = product.length;
const nestedArray = [];
const alreadyGetProduct = [];
let incrementArray = [];

for (let i = 0; i < productLength; i++) {
  const randomProduct = product.filter((x) => !alreadyGetProduct.includes(x));
  const randSelection = Math.floor(Math.random() * randomProduct.length);
  incrementArray.push(randomProduct[randSelection]);
  alreadyGetProduct.push(randomProduct[randSelection]);

  if (i % 10 == 0 && i !== 0) {
    nestedArray.push(incrementArray);
    incrementArray = [];
    continue;
  }
}
export const getRandomProduct = () => {
  return nestedArray[0];
};

interface Chunck {
  size?: number;
  start?: number;
  end?: number;
}


export const getProductsByChunck = async ({
  start,
  end,
}: Chunck): Promise<MarketStoreProduct[]> => {
  const store = marketStore.getState().products;
  const product = store?.slice(start, end);
  const resolveProduct = await Promise.resolve(product);
  
  return resolveProduct;
};
