import { createContext, ReactNode, useContext, useState } from 'react';

export type DishCategory = 'Starter' | 'Main' | 'Dessert' | 'Drink';

export type Dish = {
  id: string;
  name: string;
  category: DishCategory;
  priceCents: number;
  description: string;
};

const starterDishes: Dish[] = [
  {
    id: '1',
    name: 'Chakalaka & Pap',
    category: 'Main',
    priceCents: 8500,
    description: 'Slow-cooked spiced vegetables served with soft maize pap.',
  },
  {
    id: '2',
    name: 'Roasted Butternut Soup',
    category: 'Starter',
    priceCents: 6200,
    description: 'Silky roast butternut with toasted pumpkin seeds and thyme.',
  },
  {
    id: '3',
    name: 'Malva Pudding',
    category: 'Dessert',
    priceCents: 5800,
    description: 'Warm apricot sponge with vanilla custard.',
  },
];

const MenuContext = createContext<{
  dishes: Dish[];
  addDish: (dish: Omit<Dish, 'id'>) => void;
  removeDish: (id: string) => void;
} | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [dishes, setDishes] = useState<Dish[]>(starterDishes);

  const addDish = (dish: Omit<Dish, 'id'>) => {
    setDishes((current) => [{ ...dish, id: `${Date.now()}-${Math.random()}` }, ...current]);
  };

  const removeDish = (id: string) => {
    setDishes((current) => current.filter((dish) => dish.id !== id));
  };

  return (
    <MenuContext.Provider value={{ dishes, addDish, removeDish }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error('useMenu must be used inside MenuProvider');
  return context;
}
