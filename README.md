# Crimson House Menu

See what's for lunch / dinner in Crimson House Tokyo.

## Installation

```bash
npm install -g crimson-house-menu
```

## How to use

Simply run: `crimson-house-menu`

```bash
$ crimson-house-menu

Rakuten Crimson House Lunch Menu

9F
Main A     : Deep-fried chicken
Main B     : Salt-grilled salmon
Main B     : Stir-fried pork & eggplant with Kimuchi
Grill      : "Jingisukan" (Grilled mutton)
Bowl A     : Chicken & egg Bowl
Bowl B     : Seafood Curry
Pasta      : Spaghetti with tuna, asparagus & tomato cream sauce
Udon & Soba: "Abura Udon" (Udon noodles with seasoning oil)
Ramen      : Shyoyu Ramen Hachioji-style
Halal      : Cream stew with chicken sausage

22F
Main A     : Cheese fritters (Aji & white fish) w/ wasabi & yogurt sauce
Main B     : Simmered chicken w/ ponzu
Main C     : Stir-fried beef w/ green onion & salt
Ramen      : “Mazesoba” (Ramen w/ oil based sauce)
Udon & Soba: Soba or udon Sanuki-style
Udon & Soba: Cold udon or soba
Grill      : Cheese in hamburger steak w/ demiglace sauce “Grill ver.”
Bowl A     : Eggplants & poached egg w/ meat thick sauce on rice
Bowl B     : BBQ chicken & curry “Jamaica-style”
Pasta      : Spaghetti w/ spinach & salmon cream sauce
```

### Filters

__Floor__

Type: `number`

Show the menu by floor.

```bash
# readable
$ crimson-house-menu --floor 9
# alias
$ crimson-house-menu -f 22
```

## TODO

* add filter options for
  * nutrition
  * floor
  * meal time
* add display option compact / full
* option to display images
