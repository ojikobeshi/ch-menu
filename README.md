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

## Run without installing permanently

```bash
npx crimson-house-menu
```

### Options

__Date__

Show the menu for a specific date.

Type: `string`
Options: Date in the format `YYYYMMDD`
Alias: `d`

```bash
$ crimson-house-menu --date 20170209
```

__Floor__

Show the menu for a specific floor (9 or 22).

Type: `number`
Options: `9`, `22`
Alias: `f`

```bash
$ crimson-house-menu --floor 9
```

__Meal Time__

Show the menu for lunch, dinner or both. By default menu will be chosen
by the time of the day, lnch until 3pm and dinner any time after that.

Type: `String`
Options: `lunch`, `dinner`
Alias: `t`

```bash
$ crimson-house-menu --time lunch
```

__Show Images__

Display images of menu items, requires iterm to work.

Type: `Boolean`

```bash
$ crimson-house-menu --show-images
```

## TODO

* add filter options for
  * nutrition
* add display option compact / full
