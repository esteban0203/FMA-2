import React, { useState, useRef, createContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoginScreen } from './src/screens/LoginScreen';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, SafeAreaView, NativeSyntheticEvent, NativeScrollEvent, TextInput, Switch } from 'react-native';
import { useNavigation, NavigationProp, CommonActions } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Color scheme from context
const Colors = {
  primary: '#4CAF50',    // Stronger green
  secondary: '#2196F3',  // Bright blue
  tertiary: '#FF5722',   // Orange for challenges
  warning: '#FF6B6B',    // Red for urgent items
  background: '#F5F5F5',
  text: '#333333',
  subtleText: '#666666',
  selected: '#1B5E20',   // Dark green for selected state
  white: '#FFFFFF',
  lightBackground: '#F9F9F9',
  border: '#E0E0E0',
};

type RootStackParamList = {
  'Meal Plan': undefined;
  Overview: undefined;
  Profile: undefined;
  Inventory: undefined;
  'Add Meals': undefined;
  Login: undefined;
  Main: undefined;
};

// Add points system types
type PointsType = 'efficiency' | 'nutrition' | 'cooking';

interface Points {
  efficiency?: number;
  nutrition?: number;
  cooking?: number;
}

// Update mock data
const suggestedMeals = [
  {
    title: "Grilled Chicken Salad",
    cookTime: "20 mins",
    foodGroups: ["protein", "vegetables"],
    type: "planned",
    prepEffort: "medium",
    useExpiringSoon: ["Lettuce", "Tomatoes"],
    points: {
      nutrition: 15,
      cooking: 10
    } as Points,
    image: null
  },
  {
    title: "Veggie Stir Fry",
    cookTime: "15 mins",
    foodGroups: ["vegetables", "grains"],
    type: "suggested",
    prepEffort: "medium",
    useExpiringSoon: ["Bell Peppers"],
    points: {
      nutrition: 20,
      cooking: 8
    } as Points,
    image: null
  }
];

const quickFixes = [
  { 
    type: 'leftover', 
    title: 'Pasta from Yesterday', 
    timeLeft: '2 days', 
    foodGroups: ['grains', 'protein'],
    portion: '2 servings',
    prepTime: '2 min reheat',
    points: {
      efficiency: 10,
      nutrition: 5
    },
    color: '#FFE8E8'  // Light red
  },
  { 
    type: 'snack', 
    title: 'Crackers & Hummus', 
    foodGroups: ['grains', 'protein'],
    prepTime: 'No prep',
    points: {
      nutrition: 5
    },
    color: '#E8F8FF'  // Light blue
  }
];

const userPoints: Points = {
  efficiency: 145,
  nutrition: 280,
  cooking: 95
};

const mealPlanStatus = {
  daysPlanned: 5,
  completeMeals: 12,
  mealsNeedingIngredients: 3,
  missingIngredientsCount: 8,
  nextSuggestedMeal: {
    type: 'Dinner',
    time: '6:00 PM',
    recipe: 'Grilled Chicken Salad',
    missingIngredients: ['Chicken', 'Cherry Tomatoes']
  }
};

const inventoryStatus = {
  urgent: {
    count: 3,
    label: 'Items Expiring Soon',
    items: ['Milk', 'Bread', 'Lettuce']
  },
  low: {
    count: 5,
    label: 'Running Low',
    items: ['Eggs', 'Rice', 'Cheese', 'Chicken', 'Tomatoes']
  },
  fresh: {
    count: 12,
    label: 'Fresh Items',
  }
};

// Add AuthContext
const AuthContext = React.createContext<{
  signOut: () => void;
  isAuthenticated: boolean;
}>({
  signOut: () => {},
  isAuthenticated: false,
});

// Create navigation visibility context
const NavVisibilityContext = createContext<{
  showNavBar: boolean;
  setShowNavBar: (show: boolean) => void;
}>({
  showNavBar: true,
  setShowNavBar: () => {},
});

// Add new types for meal planning
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface Recipe {
  id: string;
  title: string;
  type: MealType;
  servings: number;
  cookTime: string;
  ingredients: {
    name: string;
    amount: string;
    isComplete: boolean;
    isFresh: boolean;
  }[];
  instructions: string[];
  points?: Points;
}

const mockPlannedMeals: Record<MealType, Recipe[]> = {
  breakfast: [
    {
      id: '1',
      title: 'Scrambled Eggs with Toast',
      type: 'breakfast',
      servings: 2,
      cookTime: '15 mins',
      ingredients: [
        { name: 'Eggs', amount: '4 large', isComplete: true, isFresh: true },
        { name: 'Bread', amount: '2 slices', isComplete: true, isFresh: false },
        { name: 'Butter', amount: '1 tbsp', isComplete: true, isFresh: true },
      ],
      instructions: [
        'Beat eggs in a bowl',
        'Heat butter in pan',
        'Cook eggs until scrambled',
        'Toast bread',
        'Serve together'
      ],
      points: {
        cooking: 5,
        nutrition: 10
      }
    },
    // Add more breakfast recipes...
  ],
  lunch: [
    {
      id: '2',
      title: 'Chicken Caesar Salad',
      type: 'lunch',
      servings: 1,
      cookTime: '20 mins',
      ingredients: [
        { name: 'Chicken Breast', amount: '1', isComplete: false, isFresh: false },
        { name: 'Romaine Lettuce', amount: '1 head', isComplete: true, isFresh: true },
        { name: 'Caesar Dressing', amount: '2 tbsp', isComplete: true, isFresh: true },
      ],
      instructions: [
        'Grill chicken breast',
        'Chop lettuce',
        'Combine ingredients',
        'Add dressing'
      ],
      points: {
        nutrition: 15,
        cooking: 8
      }
    }
  ],
  dinner: [
    {
      id: '3',
      title: 'Pasta Primavera',
      type: 'dinner',
      servings: 4,
      cookTime: '30 mins',
      ingredients: [
        { name: 'Pasta', amount: '1 lb', isComplete: true, isFresh: true },
        { name: 'Mixed Vegetables', amount: '2 cups', isComplete: true, isFresh: true },
        { name: 'Olive Oil', amount: '3 tbsp', isComplete: true, isFresh: true },
      ],
      instructions: [
        'Boil pasta',
        'Sauté vegetables',
        'Combine with sauce',
        'Season to taste'
      ],
      points: {
        cooking: 12,
        nutrition: 18
      }
    }
  ],
  snack: [
    {
      id: '4',
      title: 'Greek Yogurt with Berries',
      type: 'snack',
      servings: 1,
      cookTime: '5 mins',
      ingredients: [
        { name: 'Greek Yogurt', amount: '1 cup', isComplete: true, isFresh: true },
        { name: 'Mixed Berries', amount: '1/2 cup', isComplete: true, isFresh: true },
        { name: 'Honey', amount: '1 tsp', isComplete: true, isFresh: true },
      ],
      instructions: [
        'Add berries to yogurt',
        'Drizzle with honey'
      ],
      points: {
        nutrition: 8
      }
    }
  ]
};

function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { showNavBar, setShowNavBar } = React.useContext(NavVisibilityContext);
  const scrollOffset = useRef(0);

  // Add state for current cycle phase
  const [cyclePhase, setCyclePhase] = useState<'plan' | 'shop' | 'cook' | 'track'>('plan');

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const diff = currentOffset - scrollOffset.current;
    
    if (currentOffset <= 0) {
      setShowNavBar(true);
    } else {
      if (diff > 0) {
        setShowNavBar(false);
      } else if (diff < 0) {
        setShowNavBar(true);
      }
    }
    
    scrollOffset.current = currentOffset;
  };

  // Calculate total points
  const totalPoints = Object.values(userPoints).reduce((sum, points) => sum + points, 0);
  const nextMilestone = Math.ceil(totalPoints / 100) * 100;
  const progress = (totalPoints % 100) / 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={[styles.container]}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Ready to Eat Section */}
        <View style={[styles.section, { paddingTop: 8 }]}>
          <Text style={styles.sectionTitle}>Ready to Eat</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickOptionsScroll}
          >
            <View style={styles.quickOptionsContainer}>
              {[
                { 
                  type: 'leftover', 
                  title: 'Pasta from Yesterday', 
                  timeLeft: '2 days', 
                  prepTime: '2 min reheat',
                  points: { efficiency: 10, nutrition: 5 },
                  color: '#FFE8E8'
                },
                { 
                  type: 'snack', 
                  title: 'Crackers & Hummus', 
                  prepTime: 'No prep',
                  points: { nutrition: 5 },
                  color: '#E8F8FF'
                },
                { 
                  type: 'leftover', 
                  title: 'Chicken Stir-Fry', 
                  timeLeft: '1 day', 
                  prepTime: '3 min reheat',
                  points: { efficiency: 8, nutrition: 8 },
                  color: '#FFE8E8'
                },
                { 
                  type: 'snack', 
                  title: 'Fresh Fruit Bowl', 
                  prepTime: '5 min prep',
                  points: { nutrition: 10 },
                  color: '#E8F8FF'
                },
                { 
                  type: 'leftover', 
                  title: 'Rice & Beans', 
                  timeLeft: '3 days', 
                  prepTime: '2 min reheat',
                  points: { efficiency: 5, nutrition: 6 },
                  color: '#FFE8E8'
                }
              ].map((option, index) => (
                <Pressable 
                  key={index} 
                  style={[styles.quickOptionCard, { backgroundColor: option.color }]}
                >
                  <View style={styles.quickOptionHeader}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons 
                        name={option.type === 'leftover' ? 'time-outline' : 'cafe-outline'} 
                        size={20} 
                        color={Colors.text} 
                      />
                    </View>
                    <Text style={styles.quickOptionTitle}>{option.title}</Text>
                  </View>
                  <Text style={styles.quickOptionSubtext}>{option.prepTime}</Text>
                  {option.timeLeft && (
                    <View style={styles.timeLeftMiniTag}>
                      <Ionicons name="alert-circle-outline" size={10} color="#FF4444" />
                      <Text style={styles.timeLeftMiniText}>{option.timeLeft}</Text>
                    </View>
                  )}
                  <View style={styles.pointsContainer}>
                    {option.points && Object.entries(option.points).map(([type, value]) => (
                      <View 
                        key={type}
                        style={[
                          styles.pointsMiniTag,
                          { backgroundColor: type === 'nutrition' ? '#E8FFE8' : '#E8F8FF' }
                        ]}
                      >
                        <Ionicons 
                          name={type === 'nutrition' ? 'nutrition-outline' : 'leaf-outline'}
                          size={10}
                          color={type === 'nutrition' ? Colors.primary : '#2196F3'}
                        />
                        <Text style={styles.pointsMiniText}>+{value}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Meal Suggestions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Recipes</Text>
          <Text style={styles.sectionSubtitle}>Based on your ingredients</Text>
          {suggestedMeals.map((meal, index) => (
            <Pressable 
              key={index}
              style={styles.suggestedMealCard}
              onLongPress={() => {/* Handle delete/mark as eaten */}}
            >
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleContainer}>
                  <Text style={styles.mealTitle}>{meal.title}</Text>
                  <View style={styles.mealSubInfo}>
                    <View style={styles.cookTimeTag}>
                      <Ionicons name="time-outline" size={12} color={Colors.subtleText} />
                      <Text style={styles.cookTimeText}>{meal.cookTime}</Text>
                    </View>
                    {meal.useExpiringSoon && meal.useExpiringSoon.length > 0 && (
                      <View style={styles.expiringMiniTag}>
                        <Ionicons name="alert-circle-outline" size={12} color="#FF4444" />
                        <Text style={styles.expiringMiniText}>Use soon</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.pointsContainer}>
                  {meal.points && Object.entries(meal.points).map(([type, value]) => (
                    <View 
                      key={type}
                      style={[
                        styles.pointsMiniTag,
                        { 
                          backgroundColor: 
                            type === 'nutrition' ? '#E8FFE8' :
                            type === 'cooking' ? '#FFE8E8' :
                            '#E8F8FF'
                      }
                    ]}
                  >
                    <Ionicons 
                      name={
                        type === 'nutrition' ? 'nutrition-outline' :
                        type === 'cooking' ? 'flame-outline' :
                        'leaf-outline'
                      }
                      size={10}
                      color={
                        type === 'nutrition' ? Colors.primary :
                        type === 'cooking' ? '#FF4444' :
                        '#2196F3'
                      }
                    />
                    <Text style={styles.pointsMiniText}>+{value}</Text>
                  </View>
                  ))}
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Meal Plan Section */}
        <Pressable 
          style={styles.mealPlanPreview}
          onPress={() => navigation.navigate('Meal Plan')}
        >
          <View style={styles.mealPlanHeader}>
            <Text style={styles.sectionTitle}>Your Meal Plan</Text>
            <Pressable 
              style={styles.editMealPlanButton}
              onPress={() => navigation.navigate('Meal Plan')}
            >
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
              <Text style={styles.editMealPlanText}>Edit Plan</Text>
            </Pressable>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mealPlanStatus.daysPlanned}</Text>
              <Text style={styles.statLabel}>Days Planned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mealPlanStatus.completeMeals}</Text>
              <Text style={styles.statLabel}>Complete Meals</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF4444' }]}>
                {mealPlanStatus.missingIngredientsCount}
              </Text>
              <Text style={styles.statLabel}>Missing Ingredients</Text>
            </View>
          </View>
          <View style={styles.nextMealPreview}>
            <Text style={styles.nextMealTitle}>Suggested Next Meal</Text>
            <Text style={styles.nextMealDetails}>
              {mealPlanStatus.nextSuggestedMeal.recipe}
            </Text>
            {mealPlanStatus.nextSuggestedMeal.missingIngredients.length > 0 && (
              <Text style={styles.missingIngredientsText}>
                Missing: {mealPlanStatus.nextSuggestedMeal.missingIngredients.join(', ')}
              </Text>
            )}
          </View>
          <Pressable 
            style={styles.addMealsButton}
            onPress={() => navigation.navigate('Add Meals')}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addMealsText}>Add More Meals</Text>
          </Pressable>
        </Pressable>

        {/* Inventory Section */}
        <View style={styles.inventoryPreview}>
          <Text style={styles.sectionTitle}>Inventory Summary</Text>
          <View style={styles.inventoryGrid}>
            <View style={[styles.inventoryCard, { backgroundColor: '#FFE8E8' }]}>
              <Text style={styles.inventoryNumber}>{mealPlanStatus.missingIngredientsCount}</Text>
              <Text style={styles.inventoryLabel}>Missing Ingredients</Text>
              <View style={styles.inventoryItems}>
                <Text style={styles.inventoryItemText}>• {mealPlanStatus.missingIngredientsCount} items needed for planned meals</Text>
                {mealPlanStatus.nextSuggestedMeal.missingIngredients.map((item, index) => (
                  <Text key={index} style={styles.inventoryItemText}>• {item}</Text>
                ))}
              </View>
            </View>
            <View style={[styles.inventoryCard, { backgroundColor: '#FFF8E8' }]}>
              <Text style={styles.inventoryNumber}>{inventoryStatus.urgent.count}</Text>
              <Text style={styles.inventoryLabel}>Action Needed</Text>
              <View style={styles.inventoryItems}>
                <Text style={styles.inventoryItemText}>• {inventoryStatus.urgent.count} items expiring soon</Text>
                <Text style={styles.inventoryItemText}>• {inventoryStatus.low.count} items running low</Text>
              </View>
            </View>
          </View>
          <Pressable 
            style={styles.groceryListButton}
            onPress={() => navigation.navigate('Inventory')}
          >
            <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
            <Text style={styles.groceryListText}>View Shopping List ({mealPlanStatus.missingIngredientsCount} items needed)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Temporary screens
function DashboardScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Dashboard Screen</Text>
    </View>
  );
}

function MealPlanScreen() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  const getOverallStats = () => {
    const allMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    let totalMeals = 0;
    let totalComplete = 0;
    let totalMissing = 0;
    let totalDays = 0;

    allMealTypes.forEach(type => {
      const meals = mockPlannedMeals[type];
      totalMeals += meals.length;
      totalComplete += meals.filter(meal => 
        meal.ingredients.every(ing => ing.isComplete && ing.isFresh)
      ).length;
      totalMissing += meals.filter(meal => 
        meal.ingredients.some(ing => !ing.isComplete)
      ).length;
      totalDays += Math.ceil(meals.length / (type === 'snack' ? 2 : 1));
    });

    return { totalMeals, totalComplete, totalMissing, totalDays };
  };

  const getMealTypeStats = (type: MealType) => {
    const meals = mockPlannedMeals[type];
    const daysPlanned = Math.ceil(meals.length / (type === 'snack' ? 2 : 1));
    const completeMeals = meals.filter(meal => 
      meal.ingredients.every(ing => ing.isComplete && ing.isFresh)
    ).length;
    
    return { daysPlanned, completeMeals };
  };

  const renderMealTypeSection = (type: MealType, title: string) => {
    const stats = getMealTypeStats(type);
    
    return (
      <View style={styles.mealTypeWrapper}>
        <View style={styles.mealTypeHeader}>
          <Text style={styles.mealTypeTitle}>{title}</Text>
          <View style={styles.mealTypeStats}>
            <Text style={styles.mealTypeStatsText}>
              {stats.daysPlanned} days • {stats.completeMeals} ready
            </Text>
          </View>
        </View>
        
        {mockPlannedMeals[type].map((recipe) => (
          <Pressable
            key={recipe.id}
            style={styles.recipeCard}
            onPress={() => {
              setSelectedRecipe(recipe);
              setShowRecipeModal(true);
            }}
          >
            <View style={styles.recipeHeader}>
              <View style={styles.recipeTitleContainer}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <View style={styles.recipeSubInfo}>
                  <View style={styles.cookTimeTag}>
                    <Ionicons name="time-outline" size={12} color={Colors.subtleText} />
                    <Text style={styles.cookTimeText}>{recipe.cookTime}</Text>
                  </View>
                  <Text style={styles.servingsText}>• {recipe.servings} servings</Text>
                </View>
              </View>
              <View style={styles.recipeStatusContainer}>
                {recipe.ingredients.some(ing => !ing.isComplete) ? (
                  <Ionicons name="alert-circle" size={20} color="#FF4444" />
                ) : recipe.ingredients.some(ing => !ing.isFresh) ? (
                  <Ionicons name="warning" size={20} color="#FFA000" />
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </View>
            </View>
            
            {recipe.points && (
              <View style={styles.pointsContainer}>
                {recipe.points.nutrition && (
                  <View style={[styles.pointsSmallTag, { backgroundColor: '#E8FFE8' }]}>
                    <Ionicons name="nutrition-outline" size={12} color={Colors.primary} />
                    <Text style={styles.pointsSmallText}>+{recipe.points.nutrition}</Text>
                  </View>
                )}
                {recipe.points.cooking && (
                  <View style={[styles.pointsSmallTag, { backgroundColor: '#FFE8E8' }]}>
                    <Ionicons name="flame-outline" size={12} color="#FF4444" />
                    <Text style={styles.pointsSmallText}>+{recipe.points.cooking}</Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        ))}
      </View>
    );
  };

  const renderOverview = () => {
    const stats = getOverallStats();
    
    return (
      <View style={styles.overviewContainer}>
        {/* Base Plan Stats */}
        <View style={styles.statsGroup}>
          <Text style={styles.statsGroupTitle}>Base Plan</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, styles.statBoxHighlight]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.statNumberLarge}>{stats.totalDays}</Text>
              <Text style={styles.statLabel}>Days Planned</Text>
              <Text style={styles.statSubtext}>Week of meals</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxHighlight]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="restaurant" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.statNumberLarge}>{stats.totalMeals}</Text>
              <Text style={styles.statLabel}>Total Meals</Text>
              <Text style={styles.statSubtext}>Across all types</Text>
            </View>
          </View>
        </View>

        {/* Meal Status */}
        <View style={styles.statsGroup}>
          <Text style={styles.statsGroupTitle}>Meal Status</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: '#E8FFE8' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              </View>
              <Text style={[styles.statNumberLarge, { color: Colors.primary }]}>
                {stats.totalComplete}
              </Text>
              <Text style={styles.statLabel}>Ready to Cook</Text>
              <Text style={styles.statSubtext}>All ingredients ready</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#FFE8E8' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}>
                <Ionicons name="alert-circle" size={24} color="#FF4444" />
              </View>
              <Text style={[styles.statNumberLarge, { color: '#FF4444' }]}>
                {stats.totalMissing}
              </Text>
              <Text style={styles.statLabel}>Missing Ingredients</Text>
              <Text style={styles.statSubtext}>Need shopping</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="cafe" size={20} color="#2196F3" />
            </View>
            <View style={styles.quickStatContent}>
              <Text style={styles.quickStatNumber}>
                {mockPlannedMeals.snack.length.toString()}
              </Text>
              <Text style={styles.quickStatText}>Snacks</Text>
              <Text style={styles.quickStatDetail}>
                {mockPlannedMeals.snack.filter(meal => 
                  meal.ingredients.every(ing => ing.isComplete && ing.isFresh)
                ).length.toString()}
                {" ready • "}
                {mockPlannedMeals.snack.filter(meal => 
                  meal.ingredients.some(ing => !ing.isComplete)
                ).length.toString()}
                {" to prep"}
              </Text>
            </View>
          </View>
          <View style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="time" size={20} color={Colors.primary} />
            </View>
            <View style={styles.quickStatContent}>
              <Text style={styles.quickStatNumber}>
                {quickFixes.filter(fix => fix.type === 'leftover').length.toString()}
              </Text>
              <Text style={styles.quickStatText}>Leftovers</Text>
              <Text style={styles.quickStatDetail}>
                {quickFixes.filter(fix => 
                  fix.type === 'leftover' && parseInt(fix.timeLeft || "0") <= 1
                ).length.toString()}
                {" urgent • "}
                {quickFixes.filter(fix => 
                  fix.type === 'leftover' && parseInt(fix.timeLeft || "0") > 1
                ).length.toString()}
                {" fresh"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sectionHeaderMealPlan}>
        <Text style={styles.headerTitle}>Meal Plan</Text>
        <Pressable 
          style={styles.editButton}
          onPress={() => {/* Handle edit */}}
        >
          <Ionicons name="create-outline" size={20} color={Colors.primary} />
          <Text style={styles.editButtonText}>Edit Plan</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Progress Section */}
        <View style={[styles.section, styles.mealPlanProgress]}>
          <View style={styles.actionItems}>
            <Text style={styles.actionTitle}>Suggested Actions</Text>
            <View style={styles.actionList}>
              <View style={styles.actionItem}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={styles.actionText}>Plan your next week's meals</Text>
              </View>
              <View style={styles.actionItem}>
                <Ionicons name="nutrition-outline" size={20} color="#FF9800" />
                <Text style={styles.actionText}>Add a balanced breakfast</Text>
                <Text style={styles.actionPoints}>+15 nutrition</Text>
              </View>
              <View style={styles.actionItem}>
                <Ionicons name="leaf-outline" size={20} color={Colors.primary} />
                <Text style={styles.actionText}>Use ingredients you already have</Text>
                <Text style={styles.actionPoints}>+10 efficiency</Text>
              </View>
            </View>
          </View>
        </View>

        {renderOverview()}
        
        {/* Meal Type Sections */}
        {renderMealTypeSection('breakfast', 'Breakfast')}
        {renderMealTypeSection('lunch', 'Lunch')}
        {renderMealTypeSection('dinner', 'Dinner')}
        {renderMealTypeSection('snack', 'Snacks')}
      </ScrollView>
    </SafeAreaView>
  );
}

interface ShoppingItem {
  name: string;
  quantity: string;
  forMeals: string[];
  urgent: boolean;
}

interface ShoppingList {
  produce: ShoppingItem[];
  dairy: ShoppingItem[];
  pantry: ShoppingItem[];
  meat: ShoppingItem[];
}

interface Ingredient {
  name: string;
  quantity: string;
  usedIn?: string[];
  expiresIn?: string;
  lowStock?: boolean;
}

interface AvailableIngredients {
  fresh: Ingredient[];
  freezer: Ingredient[];
  pantry: Ingredient[];
  expiringSoon: Ingredient[];
}

function InventoryScreen() {
  const [activeTab, setActiveTab] = useState<'available' | 'shopping'>('available');
  const [showExportModal, setShowExportModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['expiringSoon']);

  // Mock data for available ingredients
  const availableIngredients: AvailableIngredients = {
    fresh: [
      {
        name: 'Chicken Breast',
        quantity: '3 pieces',
        usedIn: ['Chicken Caesar Salad'],
        expiresIn: '5 days',
      },
      {
        name: 'Romaine Lettuce',
        quantity: '2 heads',
        usedIn: ['Chicken Caesar Salad'],
        expiresIn: '7 days',
      }
    ],
    freezer: [
      {
        name: 'Ground Beef',
        quantity: '2 lbs',
        usedIn: ['Spaghetti Bolognese'],
      },
      {
        name: 'Mixed Vegetables',
        quantity: '1 bag',
        usedIn: ['Stir Fry'],
      }
    ],
    pantry: [
      {
        name: 'Rice',
        quantity: '5 lbs',
        lowStock: false,
      },
      {
        name: 'Pasta',
        quantity: '2 boxes',
        lowStock: false,
      },
      {
        name: 'Olive Oil',
        quantity: '1 bottle',
        lowStock: true,
      }
    ],
    expiringSoon: [
      {
        name: 'Milk',
        quantity: '1 gallon',
        expiresIn: '2 days',
        usedIn: ['Breakfast'],
      },
      {
        name: 'Tomatoes',
        quantity: '4 pieces',
        expiresIn: '3 days',
        usedIn: [],
      }
    ]
  };

  // Mock data for shopping list
  const shoppingList: ShoppingList = {
    produce: [
      {
        name: 'Bell Peppers',
        quantity: '3',
        forMeals: ['Veggie Stir Fry'],
        urgent: true,
      },
      {
        name: 'Carrots',
        quantity: '1 lb',
        forMeals: ['Veggie Stir Fry', 'Chicken Soup'],
        urgent: false,
      }
    ],
    dairy: [
      {
        name: 'Greek Yogurt',
        quantity: '32 oz',
        forMeals: ['Breakfast Parfait'],
        urgent: true,
      }
    ],
    pantry: [
      {
        name: 'Rice',
        quantity: '2 lb',
        forMeals: ['Veggie Stir Fry', 'Chicken Rice Bowl'],
        urgent: false,
      }
    ],
    meat: [
      {
        name: 'Ground Turkey',
        quantity: '1 lb',
        forMeals: ['Turkey Meatballs'],
        urgent: false,
      }
    ]
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const renderIngredientCard = (ingredient: any, isExpiring: boolean = false) => (
    <View style={[
      styles.ingredientCardCompact,
      isExpiring && styles.ingredientCardUrgent
    ]}>
      <View style={styles.ingredientHeaderCompact}>
        <View style={styles.ingredientMainInfo}>
          <Text style={styles.ingredientNameCompact}>{ingredient.name}</Text>
          <Text style={styles.quantityTextCompact}>{ingredient.quantity}</Text>
        </View>
        <View style={styles.ingredientActions}>
          {ingredient.expiresIn && (
            <View style={[
              styles.expiryBadge,
              isExpiring && styles.expiryBadgeUrgent
            ]}>
              <Ionicons 
                name={isExpiring ? "warning-outline" : "time-outline"} 
                size={14} 
                color={isExpiring ? "#FF4444" : Colors.text} 
              />
              <Text style={[
                styles.expiryText,
                isExpiring && styles.expiryTextUrgent
              ]}>
                {ingredient.expiresIn}
              </Text>
            </View>
          )}
          <Pressable style={styles.actionButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text} />
          </Pressable>
        </View>
      </View>
      {ingredient.usedIn && ingredient.usedIn.length > 0 && (
        <Text style={styles.usedInTextCompact}>
          Used in: {ingredient.usedIn.join(', ')}
        </Text>
      )}
    </View>
  );

  const renderStorageSection = (title: string, items: any[], icon: keyof typeof Ionicons.glyphMap) => {
    const isExpanded = expandedSections.includes(title.toLowerCase());
    
    return (
      <View style={styles.storageSection}>
        <Pressable 
          style={styles.storageSectionHeader}
          onPress={() => toggleSection(title.toLowerCase())}
        >
          <View style={styles.storageTitleContainer}>
            <View style={styles.storageIconContainer}>
              <Ionicons name={icon} size={20} color={Colors.text} />
            </View>
            <View>
              <Text style={styles.storageSectionTitle}>{title}</Text>
              <Text style={styles.storageSectionSubtitle}>
                {items.length} items
              </Text>
            </View>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={Colors.text} 
          />
        </Pressable>
        
        {isExpanded && (
          <View style={styles.storageContent}>
            {items.map((item, index) => renderIngredientCard(item, title === 'Expiring Soon'))}
          </View>
        )}
      </View>
    );
  };

  const renderAvailableIngredients = () => (
    <ScrollView style={styles.scrollContainer}>
      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Pressable style={styles.quickActionButton}>
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.quickActionText}>Add Items</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton}>
          <Ionicons name="scan-outline" size={24} color={Colors.primary} />
          <Text style={styles.quickActionText}>Scan Receipt</Text>
        </Pressable>
      </View>

      {/* Storage Sections */}
      {renderStorageSection('Expiring Soon', availableIngredients.expiringSoon, 'warning-outline')}
      {renderStorageSection('Fresh', availableIngredients.fresh, 'leaf-outline')}
      {renderStorageSection('Freezer', availableIngredients.freezer, 'snow-outline')}
      {renderStorageSection('Pantry', availableIngredients.pantry, 'cube-outline')}
    </ScrollView>
  );

  const renderShoppingList = () => (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.shoppingHeaderEnhanced}>
        <View style={styles.shoppingStatsEnhanced}>
          <View style={styles.statItemEnhanced}>
            <Text style={styles.statNumberLarge}>
              {Object.values(shoppingList).reduce((sum, category) => sum + category.length, 0)}
            </Text>
            <Text style={styles.statLabelEnhanced}>Items Needed</Text>
          </View>
          <View style={[styles.statItemEnhanced, { backgroundColor: '#FFF8F8' }]}>
            <Text style={[styles.statNumberLarge, { color: '#FF4444' }]}>
              {Object.values(shoppingList).reduce((sum, category) => 
                sum + category.filter(item => item.urgent).length, 0
              )}
            </Text>
            <Text style={styles.statLabelEnhanced}>Urgent Items</Text>
          </View>
        </View>
        
        <Pressable 
          style={styles.exportButtonEnhanced}
          onPress={() => setShowExportModal(true)}
        >
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          <Text style={styles.exportButtonTextEnhanced}>Export Shopping List</Text>
        </Pressable>
      </View>

      {Object.entries(shoppingList).map(([category, items]) => (
        <View key={category} style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <View style={styles.categoryTitleContainer}>
              <Text style={styles.categoryTitle}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              <Text style={styles.categorySubtitle}>{items.length} items</Text>
            </View>
            <View style={styles.categoryIconContainer}>
              <Ionicons 
                name={
                  category === 'produce' ? 'leaf-outline' :
                  category === 'dairy' ? 'water-outline' :
                  category === 'meat' ? 'restaurant-outline' :
                  'cube-outline'
                } 
                size={24} 
                color={Colors.primary} 
              />
            </View>
          </View>
          
          {items.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.shoppingItemEnhanced,
                item.urgent && styles.shoppingItemUrgentEnhanced
              ]}
            >
              <View style={styles.shoppingItemHeaderEnhanced}>
                <View style={styles.shoppingItemMainEnhanced}>
                  <Text style={styles.shoppingItemNameEnhanced}>{item.name}</Text>
                  <View style={[
                    styles.quantityBadgeEnhanced,
                    item.urgent && styles.quantityBadgeUrgent
                  ]}>
                    <Text style={[
                      styles.quantityTextEnhanced,
                      item.urgent && { color: '#FF4444' }
                    ]}>{item.quantity}</Text>
                  </View>
                </View>
                {item.urgent && (
                  <View style={styles.urgentTagEnhanced}>
                    <Ionicons name="flash" size={16} color="#FF4444" />
                    <Text style={styles.urgentTextEnhanced}>Needed soon</Text>
                  </View>
                )}
              </View>
              
              {item.forMeals && item.forMeals.length > 0 && (
                <View style={styles.mealsContainerEnhanced}>
                  <Text style={styles.mealsLabelEnhanced}>For:</Text>
                  <View style={styles.mealTagsContainerEnhanced}>
                    {item.forMeals.map((meal, idx) => (
                      <View key={idx} style={[
                        styles.mealTagEnhanced,
                        item.urgent && styles.mealTagUrgent
                      ]}>
                        <Ionicons 
                          name="restaurant-outline" 
                          size={14} 
                          color={item.urgent ? '#FF4444' : Colors.primary} 
                        />
                        <Text style={[
                          styles.mealTagTextEnhanced,
                          item.urgent && { color: '#FF4444' }
                        ]}>{meal}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      ))}

      {showExportModal && (
        <View style={styles.exportModalEnhanced}>
          <Pressable 
            style={styles.exportModalOverlay}
            onPress={() => setShowExportModal(false)}
          />
          <View style={styles.exportModalContentEnhanced}>
            <Text style={styles.exportModalTitleEnhanced}>Export Shopping List</Text>
            
            <Pressable 
              style={styles.exportOptionEnhanced}
              onPress={() => {
                // Handle Instacart export
                setShowExportModal(false);
              }}
            >
              <View style={styles.exportOptionIconContainer}>
                <Ionicons name="cart" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.exportOptionTextContainer}>
                <Text style={styles.exportOptionTitleEnhanced}>Send to Instacart</Text>
                <Text style={styles.exportOptionSubtitle}>Automatically add items to cart</Text>
              </View>
            </Pressable>
            
            <Pressable 
              style={styles.exportOptionEnhanced}
              onPress={() => {
                // Handle PDF export
                setShowExportModal(false);
              }}
            >
              <View style={[styles.exportOptionIconContainer, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="document-text" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.exportOptionTextContainer}>
                <Text style={styles.exportOptionTitleEnhanced}>Export as PDF</Text>
                <Text style={styles.exportOptionSubtitle}>Organized, printable list</Text>
              </View>
            </Pressable>
            
            <Pressable 
              style={styles.exportOptionEnhanced}
              onPress={() => {
                // Handle text list export
                setShowExportModal(false);
              }}
            >
              <View style={[styles.exportOptionIconContainer, { backgroundColor: '#FF5722' }]}>
                <Ionicons name="list" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.exportOptionTextContainer}>
                <Text style={styles.exportOptionTitleEnhanced}>Copy as Text</Text>
                <Text style={styles.exportOptionSubtitle}>Simple, shareable format</Text>
              </View>
            </Pressable>
            
            <Pressable 
              style={styles.closeButtonEnhanced}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.closeButtonTextEnhanced}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sectionHeaderInventory}>
        <Text style={styles.headerTitle}>Inventory</Text>
      </View>

      <View style={styles.tabContainer}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'available' && styles.activeTab
          ]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'available' && styles.activeTabText
          ]}>
            Available
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'shopping' && styles.activeTab
          ]}
          onPress={() => setActiveTab('shopping')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'shopping' && styles.activeTabText
          ]}>
            Shopping List
          </Text>
        </Pressable>
      </View>

      {activeTab === 'available' ? renderAvailableIngredients() : renderShoppingList()}
    </SafeAreaView>
  );
}

function ShoppingListScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Shopping List Screen</Text>
    </View>
  );
}

// Add new types for milestones
type MilestoneCategory = 'efficiency' | 'nutrition' | 'cooking';
type MilestoneStatus = 'in_progress' | 'completed';

interface Milestone {
  id: string;
  category: MilestoneCategory;
  title: string;
  description: string;
  pointsRequired: number;
  reward: number;
  status: MilestoneStatus;
}

// Add mock milestone data
const milestones: Record<MilestoneCategory, Milestone[]> = {
  efficiency: [
    {
      id: 'e1',
      category: 'efficiency',
      title: 'Leftover Master',
      description: 'Use leftovers for 5 meals in a week',
      pointsRequired: 50,
      reward: 100,
      status: 'in_progress'
    },
    {
      id: 'e2',
      category: 'efficiency',
      title: 'Smart Shopper',
      description: 'Complete 3 shopping trips using optimized lists',
      pointsRequired: 75,
      reward: 150,
      status: 'in_progress'
    },
    {
      id: 'e3',
      category: 'efficiency',
      title: 'Waste Warrior',
      description: 'Go a full week without any expired ingredients',
      pointsRequired: 100,
      reward: 200,
      status: 'in_progress'
    }
  ],
  nutrition: [
    {
      id: 'n1',
      category: 'nutrition',
      title: 'Veggie Victory',
      description: 'Include vegetables in 10 meals',
      pointsRequired: 50,
      reward: 100,
      status: 'in_progress'
    },
    {
      id: 'n2',
      category: 'nutrition',
      title: 'Balanced Diet',
      description: 'Prepare meals with all food groups for 5 days',
      pointsRequired: 75,
      reward: 150,
      status: 'in_progress'
    },
    {
      id: 'n3',
      category: 'nutrition',
      title: 'Health Champion',
      description: 'Maintain balanced meals for 2 weeks',
      pointsRequired: 100,
      reward: 200,
      status: 'in_progress'
    },
    {
      id: 'n4',
      category: 'nutrition',
      title: 'Protein Power',
      description: 'Include a protein source in 7 consecutive meals',
      pointsRequired: 60,
      reward: 125,
      status: 'in_progress'
    }
  ],
  cooking: [
    {
      id: 'c1',
      category: 'cooking',
      title: 'Kitchen Novice',
      description: 'Cook 5 different recipes',
      pointsRequired: 50,
      reward: 100,
      status: 'in_progress'
    },
    {
      id: 'c2',
      category: 'cooking',
      title: 'Recipe Explorer',
      description: 'Try 3 new cooking techniques',
      pointsRequired: 75,
      reward: 150,
      status: 'in_progress'
    },
    {
      id: 'c3',
      category: 'cooking',
      title: 'Chef in Training',
      description: 'Successfully complete 10 different recipes',
      pointsRequired: 100,
      reward: 200,
      status: 'in_progress'
    }
  ]
};

type MeasurementSystem = 'metric' | 'imperial';

interface CookingAppliance {
  id: string;
  name: string;
  isAvailable: boolean;
}

interface UserSettings {
  allergens: string[];
  measurementSystem: MeasurementSystem;
  cookingAppliances: CookingAppliance[];
}

const defaultCookingAppliances: CookingAppliance[] = [
  { id: 'oven', name: 'Oven', isAvailable: true },
  { id: 'stovetop', name: 'Stovetop', isAvailable: true },
  { id: 'microwave', name: 'Microwave', isAvailable: true },
  { id: 'airfryer', name: 'Air Fryer', isAvailable: false },
  { id: 'slowcooker', name: 'Slow Cooker', isAvailable: false },
  { id: 'pressurecooker', name: 'Pressure Cooker', isAvailable: false },
  { id: 'blender', name: 'Blender', isAvailable: true },
  { id: 'foodprocessor', name: 'Food Processor', isAvailable: false }
];

const commonAllergens = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Gluten'
];

function ProfileScreen() {
  const { signOut } = React.useContext(AuthContext);
  const [cyclePhase, setCyclePhase] = useState<'plan' | 'shop' | 'cook' | 'track'>('plan');
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    allergens: [],
    measurementSystem: 'metric',
    cookingAppliances: defaultCookingAppliances
  });

  const renderPointsModal = () => {
    if (!showPointsModal) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Progress Journey</Text>
            <Pressable 
              style={styles.closeModalButton}
              onPress={() => setShowPointsModal(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.categorySelection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsContainer}
            >
              {(['efficiency', 'nutrition', 'cooking'] as MilestoneCategory[]).map((category) => (
                <Pressable
                  key={category}
                  style={[
                    styles.categoryPill,
                    selectedCategory === category && styles.categoryPillActive,
                    { 
                      backgroundColor: selectedCategory === category 
                        ? category === 'nutrition' 
                          ? 'rgba(76, 175, 80, 0.2)' 
                          : category === 'efficiency'
                            ? 'rgba(33, 150, 243, 0.2)'
                            : 'rgba(255, 68, 68, 0.2)'
                        : 'rgba(0, 0, 0, 0.05)'
                    }
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Ionicons 
                    name={
                      category === 'nutrition' ? 'nutrition-outline' :
                      category === 'efficiency' ? 'leaf-outline' :
                      'flame-outline'
                    } 
                    size={20} 
                    color={
                      category === 'nutrition' ? Colors.primary :
                      category === 'efficiency' ? '#2196F3' :
                      '#FF4444'
                    }
                  />
                  <Text 
                    style={[
                      styles.categoryPillText,
                      selectedCategory === category && styles.categoryPillTextActive,
                      { 
                        color: category === 'nutrition' 
                          ? Colors.primary 
                          : category === 'efficiency'
                            ? '#2196F3'
                            : '#FF4444'
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <ScrollView style={styles.modalScroll}>
            {selectedCategory && (
              <View style={styles.categoryOverview}>
                <View style={[
                  styles.categoryHeader,
                  { 
                    backgroundColor: 
                      selectedCategory === 'nutrition' 
                        ? 'rgba(76, 175, 80, 0.1)' 
                        : selectedCategory === 'efficiency'
                          ? 'rgba(33, 150, 243, 0.1)'
                          : 'rgba(255, 68, 68, 0.1)'
                  }
                ]}>
                  <View style={[
                    styles.categoryIcon,
                    {
                      backgroundColor: '#FFFFFF',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3
                    }
                  ]}>
                    <Ionicons 
                      name={
                        selectedCategory === 'nutrition' ? 'nutrition-outline' :
                        selectedCategory === 'efficiency' ? 'leaf-outline' :
                        'flame-outline'
                      } 
                      size={32} 
                      color={
                        selectedCategory === 'nutrition' ? Colors.primary :
                        selectedCategory === 'efficiency' ? '#2196F3' :
                        '#FF4444'
                      }
                    />
                  </View>
                  <View style={styles.categoryStats}>
                    <Text style={styles.categoryPoints}>
                      {userPoints[selectedCategory]} points
                    </Text>
                    <Text style={styles.categorySubtext}>
                      {selectedCategory === 'nutrition' && 'Track your healthy eating habits'}
                      {selectedCategory === 'efficiency' && 'Optimize your meal planning and shopping'}
                      {selectedCategory === 'cooking' && 'Develop your cooking skills'}
                    </Text>
                  </View>
                </View>

                {/* Milestones */}
                <View style={styles.milestonesContainer}>
                  <Text style={styles.milestonesTitle}>Milestones</Text>
                  {milestones[selectedCategory].map((milestone) => {
                    const progress = userPoints[selectedCategory] / milestone.pointsRequired;
                    return (
                      <View key={milestone.id} style={[
                        styles.milestoneCard,
                        { 
                          backgroundColor: '#FFFFFF',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3
                        }
                      ]}>
                        <View style={styles.milestoneHeader}>
                          <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                          <View style={styles.rewardBadge}>
                            <Ionicons name="trophy" size={16} color="#FFD700" />
                            <Text style={styles.rewardText}>+{milestone.reward}</Text>
                          </View>
                        </View>
                        <Text style={styles.milestoneDescription}>
                          {milestone.description}
                        </Text>
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill,
                                { 
                                  width: `${Math.min(progress * 100, 100)}%`,
                                  backgroundColor:
                                    selectedCategory === 'nutrition' ? Colors.primary :
                                    selectedCategory === 'efficiency' ? '#2196F3' :
                                    '#FF4444'
                                }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {userPoints[selectedCategory]}/{milestone.pointsRequired} points
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderSettingsModal = () => {
    if (!showSettingsModal) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <Pressable 
              style={styles.closeModalButton}
              onPress={() => setShowSettingsModal(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalScroll}>
            {/* Measurement System */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Measurement System</Text>
              <View style={styles.measurementOptions}>
                <Pressable
                  style={[
                    styles.measurementOption,
                    settings.measurementSystem === 'metric' && styles.measurementOptionActive
                  ]}
                  onPress={() => setSettings(prev => ({ ...prev, measurementSystem: 'metric' }))}
                >
                  <Text style={[
                    styles.measurementOptionText,
                    settings.measurementSystem === 'metric' && styles.measurementOptionTextActive
                  ]}>Metric</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.measurementOption,
                    settings.measurementSystem === 'imperial' && styles.measurementOptionActive
                  ]}
                  onPress={() => setSettings(prev => ({ ...prev, measurementSystem: 'imperial' }))}
                >
                  <Text style={[
                    styles.measurementOptionText,
                    settings.measurementSystem === 'imperial' && styles.measurementOptionTextActive
                  ]}>Imperial</Text>
                </Pressable>
              </View>
            </View>

            {/* Allergens */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Allergens</Text>
              <Text style={styles.settingsSectionSubtitle}>Select any allergens to avoid</Text>
              <View style={styles.allergensList}>
                {commonAllergens.map(allergen => (
                  <Pressable
                    key={allergen}
                    style={[
                      styles.allergenChip,
                      settings.allergens.includes(allergen) && styles.allergenChipActive
                    ]}
                    onPress={() => {
                      setSettings(prev => ({
                        ...prev,
                        allergens: prev.allergens.includes(allergen)
                          ? prev.allergens.filter(a => a !== allergen)
                          : [...prev.allergens, allergen]
                      }));
                    }}
                  >
                    <Text style={[
                      styles.allergenChipText,
                      settings.allergens.includes(allergen) && styles.allergenChipTextActive
                    ]}>{allergen}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Cooking Appliances */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Available Appliances</Text>
              <Text style={styles.settingsSectionSubtitle}>Select the cooking appliances you have</Text>
              <View style={styles.appliancesList}>
                {settings.cookingAppliances.map(appliance => (
                  <Pressable
                    key={appliance.id}
                    style={[
                      styles.applianceItem,
                      appliance.isAvailable && styles.applianceItemActive
                    ]}
                    onPress={() => {
                      setSettings(prev => ({
                        ...prev,
                        cookingAppliances: prev.cookingAppliances.map(a =>
                          a.id === appliance.id ? { ...a, isAvailable: !a.isAvailable } : a
                        )
                      }));
                    }}
                  >
                    <Ionicons
                      name={appliance.isAvailable ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={appliance.isAvailable ? Colors.primary : Colors.text}
                    />
                    <Text style={[
                      styles.applianceText,
                      appliance.isAvailable && styles.applianceTextActive
                    ]}>{appliance.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              style={styles.saveButton}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Points Overview */}
        <Pressable 
          style={styles.pointsOverview}
          onPress={() => {
            setShowPointsModal(true);
            setSelectedCategory('nutrition');
          }}
        >
          <View style={styles.pointsHeader}>
            <View>
              <Text style={styles.pointsTitle}>Your Points</Text>
              <Text style={styles.pointsSubtitle}>Track your progress and achievements</Text>
            </View>
            <Pressable 
              style={styles.expandButton}
              onPress={() => {
                setShowPointsModal(true);
                setSelectedCategory('nutrition');
              }}
            >
              <Ionicons name="chevron-forward" size={24} color={Colors.text} />
            </Pressable>
          </View>
          
          <View style={styles.pointsGrid}>
            <View style={[styles.pointsCard, { backgroundColor: '#E8F8FF' }]}>
              <View style={styles.pointsIconContainer}>
                <Ionicons name="leaf-outline" size={24} color="#2196F3" />
              </View>
              <View style={styles.pointsTextContainer}>
                <Text style={styles.pointsNumber}>{userPoints.efficiency}</Text>
                <Text style={styles.pointsLabel}>Efficiency</Text>
              </View>
            </View>
            
            <View style={[styles.pointsCard, { backgroundColor: '#E8FFE8' }]}>
              <View style={styles.pointsIconContainer}>
                <Ionicons name="nutrition-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.pointsTextContainer}>
                <Text style={styles.pointsNumber}>{userPoints.nutrition}</Text>
                <Text style={styles.pointsLabel}>Nutrition</Text>
              </View>
            </View>
            
            <View style={[styles.pointsCard, { backgroundColor: '#FFE8E8' }]}>
              <View style={styles.pointsIconContainer}>
                <Ionicons name="flame-outline" size={24} color="#FF4444" />
              </View>
              <View style={styles.pointsTextContainer}>
                <Text style={styles.pointsNumber}>{userPoints.cooking}</Text>
                <Text style={styles.pointsLabel}>Cooking</Text>
              </View>
            </View>
          </View>
        </Pressable>

        <View style={styles.sectionSpacer} />

        {/* Cycle Progress */}
        <View style={styles.cycleContainer}>
          <View style={styles.cycleHeader}>
            <Text style={styles.cycleTitle}>Your Progress</Text>
            <View style={styles.cycleSteps}>
              {['plan', 'shop', 'cook', 'track'].map((phase) => (
                <View key={phase} style={styles.cycleStep}>
                  <View style={[
                    styles.cycleIcon,
                    phase === cyclePhase && styles.cycleIconActive
                  ]}>
                    <Ionicons 
                      name={
                        phase === 'plan' ? 'calendar' :
                        phase === 'shop' ? 'cart' :
                        phase === 'cook' ? 'restaurant' :
                        'analytics'
                      } 
                      size={24} 
                      color={phase === cyclePhase ? '#FFFFFF' : Colors.text}
                    />
                  </View>
                  <Text style={[
                    styles.cycleText,
                    phase === cyclePhase && styles.cycleTextActive
                  ]}>
                    {phase.charAt(0).toUpperCase() + phase.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Next Steps */}
          <View style={styles.nextStepsContainer}>
            <Text style={styles.nextStepsTitle}>Next Steps</Text>
            {cyclePhase === 'plan' && (
              <>
                <Pressable 
                  style={styles.nextStepCard}
                  onPress={() => navigation.navigate('Meal Plan')}
                >
                  <View style={styles.nextStepIcon}>
                    <Ionicons name="calendar" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.nextStepContent}>
                    <Text style={styles.nextStepTitle}>Plan Your Meals</Text>
                    <Text style={styles.nextStepDescription}>
                      You have {mealPlanStatus.daysPlanned} days planned. Add more meals to complete your week.
                    </Text>
                  </View>
                </Pressable>
                {mealPlanStatus.missingIngredientsCount > 0 && (
                  <Pressable 
                    style={styles.nextStepCard}
                    onPress={() => navigation.navigate('Inventory')}
                  >
                    <View style={[styles.nextStepIcon, { backgroundColor: '#FFE8E8' }]}>
                      <Ionicons name="cart" size={24} color="#FF4444" />
                    </View>
                    <View style={styles.nextStepContent}>
                      <Text style={styles.nextStepTitle}>Get Missing Ingredients</Text>
                      <Text style={styles.nextStepDescription}>
                        {mealPlanStatus.missingIngredientsCount} items needed for your planned meals.
                      </Text>
                    </View>
                  </Pressable>
                )}
              </>
            )}
            {cyclePhase === 'shop' && (
              <Pressable 
                style={styles.nextStepCard}
                onPress={() => navigation.navigate('Inventory')}
              >
                <View style={styles.nextStepIcon}>
                  <Ionicons name="basket" size={24} color={Colors.primary} />
                </View>
                <View style={styles.nextStepContent}>
                  <Text style={styles.nextStepTitle}>Update Your Inventory</Text>
                  <Text style={styles.nextStepDescription}>
                    Mark items as purchased and organize your ingredients.
                  </Text>
                </View>
              </Pressable>
            )}
            {cyclePhase === 'cook' && (
              <>
                <Pressable 
                  style={styles.nextStepCard}
                  onPress={() => {/* Handle marking meal as cooked */}}
                >
                  <View style={styles.nextStepIcon}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.nextStepContent}>
                    <Text style={styles.nextStepTitle}>Track Your Progress</Text>
                    <Text style={styles.nextStepDescription}>
                      Mark meals as cooked and update your inventory.
                    </Text>
                  </View>
                </Pressable>
                {inventoryStatus.urgent.count > 0 && (
                  <Pressable 
                    style={styles.nextStepCard}
                    onPress={() => navigation.navigate('Inventory')}
                  >
                    <View style={[styles.nextStepIcon, { backgroundColor: '#FFE8E8' }]}>
                      <Ionicons name="warning" size={24} color="#FF4444" />
                    </View>
                    <View style={styles.nextStepContent}>
                      <Text style={styles.nextStepTitle}>Use Expiring Items</Text>
                      <Text style={styles.nextStepDescription}>
                        {inventoryStatus.urgent.count} items need to be used soon.
                      </Text>
                    </View>
                  </Pressable>
                )}
              </>
            )}
            {cyclePhase === 'track' && (
              <Pressable 
                style={styles.nextStepCard}
                onPress={() => {/* Handle viewing achievements */}}
              >
                <View style={styles.nextStepIcon}>
                  <Ionicons name="trophy" size={24} color={Colors.primary} />
                </View>
                <View style={styles.nextStepContent}>
                  <Text style={styles.nextStepTitle}>View Your Achievements</Text>
                  <Text style={styles.nextStepDescription}>
                    You've completed {mealPlanStatus.completeMeals} meals this week. Great progress!
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.sectionSpacer} />

        {/* Spacer to push preferences to bottom */}
        <View style={{ flex: 1, minHeight: 24 }} />

        {/* Preferences Section */}
        <Pressable
          style={styles.settingsPreview}
          onPress={() => setShowSettingsModal(true)}
        >
          <View style={styles.settingsPreviewHeader}>
            <Text style={styles.settingsPreviewTitle}>Your Preferences</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.text} />
          </View>
          
          <View style={styles.settingsPreviewContent}>
            {/* Measurement System */}
            <View style={styles.settingsPreviewItem}>
              <View style={styles.settingsPreviewIcon}>
                <Ionicons name="scale-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.settingsPreviewInfo}>
                <Text style={styles.settingsPreviewLabel}>Measurement System</Text>
                <Text style={styles.settingsPreviewValue}>
                  {settings.measurementSystem === 'metric' ? 'Metric (g, ml)' : 'Imperial (oz, cups)'}
                </Text>
              </View>
            </View>

            {/* Allergens */}
            <View style={styles.settingsPreviewItem}>
              <View style={styles.settingsPreviewIcon}>
                <Ionicons name="warning-outline" size={24} color="#FF9800" />
              </View>
              <View style={styles.settingsPreviewInfo}>
                <Text style={styles.settingsPreviewLabel}>Allergens</Text>
                <Text style={styles.settingsPreviewValue}>
                  {settings.allergens.length > 0 
                    ? settings.allergens.join(', ')
                    : 'No allergens set'}
                </Text>
              </View>
            </View>

            {/* Appliances */}
            <View style={styles.settingsPreviewItem}>
              <View style={styles.settingsPreviewIcon}>
                <Ionicons name="restaurant-outline" size={24} color="#2196F3" />
              </View>
              <View style={styles.settingsPreviewInfo}>
                <Text style={styles.settingsPreviewLabel}>Available Appliances</Text>
                <Text style={styles.settingsPreviewValue}>
                  {settings.cookingAppliances.filter(a => a.isAvailable).length} appliances available
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Logout Button */}
        <Pressable 
          style={[styles.logoutButton, { marginTop: 16, marginBottom: 24 }]}
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>

      {renderPointsModal()}
      {renderSettingsModal()}
    </SafeAreaView>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 85,
          paddingTop: 8,
          paddingBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.subtleText,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons name="list" size={size} color={color} />
            </View>
          ),
          tabBarLabel: ({ color }) => (
            <Text style={[styles.tabLabel, { color }]}>Inventory</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Meal Plan"
        component={MealPlanScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons name="calendar" size={size} color={color} />
            </View>
          ),
          tabBarLabel: ({ color }) => (
            <Text style={[styles.tabLabel, { color }]}>Meal Plan</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Overview"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <View style={styles.overviewIconContainer}>
              <View style={styles.overviewIconBackground}>
                <Ionicons name="restaurant" size={32} color="#FFFFFF" />
              </View>
            </View>
          ),
          tabBarLabel: ({ color }) => (
            <Text style={[styles.tabLabel, { color }]}>Overview</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Add Meals"
        component={AddMealsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons name="add-circle" size={size} color={color} />
            </View>
          ),
          tabBarLabel: ({ color }) => (
            <Text style={[styles.tabLabel, { color }]}>Add Meals</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons name="person" size={size} color={color} />
            </View>
          ),
          tabBarLabel: ({ color }) => (
            <Text style={[styles.tabLabel, { color }]}>Profile</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AddMealsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [step, setStep] = useState(1);
  const [mealCounts, setMealCounts] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0
  });
  const [preferences, setPreferences] = useState({
    skillLevel: 'medium',
    cookingTime: '30-60',
    dietary: [] as string[],
    notes: '',
    useFavorites: true,
    useLeftovers: true,
    optimizeIngredients: true
  });

  // Add suggestions based on current meal plan
  const suggestions = {
    breakfast: {
      recommended: 2,
      reason: "Based on your current plan, you're low on breakfast options"
    },
    lunch: {
      recommended: 3,
      reason: "You have several lunch meetings this week"
    },
    dinner: {
      recommended: 2,
      reason: "You already have 3 dinners planned"
    },
    snack: {
      recommended: 4,
      reason: "Good to have healthy snacks available"
    }
  };

  const updateMealCount = (type: keyof typeof mealCounts, increment: boolean) => {
    setMealCounts(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + (increment ? 1 : -1))
    }));
  };

  const totalMeals = Object.values(mealCounts).reduce((sum, count) => sum + count, 0);
  const progress = (step / 3) * 100;

  // Add quick suggestions component
  const renderQuickSuggestion = (type: keyof typeof mealCounts) => (
    <Pressable
      style={styles.suggestionButton}
      onPress={() => setMealCounts(prev => ({
        ...prev,
        [type]: suggestions[type].recommended
      }))}
    >
      <Text style={styles.suggestionButtonText}>
        Suggest {suggestions[type].recommended}
      </Text>
      <Text style={styles.suggestionReason}>
        {suggestions[type].reason}
      </Text>
    </Pressable>
  );

  const renderMealTypeCounter = (type: keyof typeof mealCounts, title: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={styles.mealTypeWrapper}>
      <View style={styles.mealTypeHeader}>
        <View style={styles.mealTypeIcon}>
          <Ionicons name={icon} size={24} color={Colors.text} />
        </View>
        <View style={styles.mealTypeTitleContainer}>
          <Text style={styles.mealTypeTitle}>{title}</Text>
          <Text style={styles.mealTypeSubtitle}>
            Currently planned: {mockPlannedMeals[type].length} meals
          </Text>
        </View>
      </View>
      <View style={styles.mealTypeControls}>
        <View style={styles.counterContainer}>
          <Pressable 
            style={styles.counterButton}
            onPress={() => updateMealCount(type, false)}
          >
            <Ionicons name="remove" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.counterText}>{mealCounts[type]}</Text>
          <Pressable 
            style={styles.counterButton}
            onPress={() => updateMealCount(type, true)}
          >
            <Ionicons name="add" size={24} color={Colors.text} />
          </Pressable>
        </View>
        {renderQuickSuggestion(type)}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How many meals do you want to add?</Text>
      {renderMealTypeCounter('breakfast', 'Breakfast', 'sunny-outline')}
      {renderMealTypeCounter('lunch', 'Lunch', 'restaurant-outline')}
      {renderMealTypeCounter('dinner', 'Dinner', 'moon-outline')}
      {renderMealTypeCounter('snack', 'Snacks', 'cafe-outline')}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Set your preferences</Text>
      
      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceTitle}>Cooking Skill Level</Text>
        <View style={styles.skillLevelContainer}>
          {['easy', 'medium', 'advanced'].map((level) => (
            <Pressable
              key={level}
              style={[
                styles.skillLevelOption,
                preferences.skillLevel === level && styles.skillLevelSelected
              ]}
              onPress={() => setPreferences(prev => ({ ...prev, skillLevel: level }))}
            >
              <Ionicons 
                name={
                  level === 'easy' ? 'leaf-outline' :
                  level === 'medium' ? 'flame-outline' :
                  'restaurant-outline'
                }
                size={20}
                color={preferences.skillLevel === level ? Colors.primary : Colors.text}
              />
              <Text style={[
                styles.skillLevelText,
                preferences.skillLevel === level && styles.skillLevelTextSelected
              ]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceTitle}>Cooking Time</Text>
        <View style={styles.timeSelector}>
          {['15-30', '30-60', '60+'].map((time) => (
            <Pressable
              key={time}
              style={[
                styles.timeOption,
                preferences.cookingTime === time && styles.timeOptionSelected
              ]}
              onPress={() => setPreferences(prev => ({ ...prev, cookingTime: time }))}
            >
              <Text style={[
                styles.timeOptionText,
                preferences.cookingTime === time && styles.timeOptionTextSelected
              ]}>
                {time} mins
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceTitle}>Dietary Preferences</Text>
        <View style={styles.dietaryContainer}>
          {['Vegetarian', 'Vegan', 'Gluten-Free', 'Low-Carb', 'High-Protein'].map((diet) => (
            <Pressable
              key={diet}
              style={[
                styles.dietaryOption,
                preferences.dietary.includes(diet) && styles.dietarySelected
              ]}
              onPress={() => setPreferences(prev => ({
                ...prev,
                dietary: prev.dietary.includes(diet)
                  ? prev.dietary.filter(d => d !== diet)
                  : [...prev.dietary, diet]
              }))}
            >
              <Text style={[
                styles.dietaryText,
                preferences.dietary.includes(diet) && styles.dietaryTextSelected
              ]}>
                {diet}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceTitle}>Additional Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Any specific ingredients or preferences..."
          value={preferences.notes}
          onChangeText={(text) => setPreferences(prev => ({ ...prev, notes: text }))}
          multiline
        />
      </View>
    </View>
  );

  const renderStep3 = () => {
    // Calculate estimated days based on meal counts
    const estimatedDays = Math.ceil(
      Math.max(
        mealCounts.breakfast / 1, // 1 breakfast per day
        mealCounts.lunch / 1,     // 1 lunch per day
        mealCounts.dinner / 1,    // 1 dinner per day
        mealCounts.snack / 2      // assume 2 snacks per day
      )
    );

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Review and Generate</Text>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Meal Plan Summary</Text>
          <View style={styles.reviewGrid}>
            <View style={[styles.reviewItem, styles.reviewItemHighlight]}>
              <Text style={styles.reviewValue}>{totalMeals}</Text>
              <Text style={styles.reviewLabel}>Total Meals</Text>
            </View>
            <View style={[styles.reviewItem, styles.reviewItemHighlight]}>
              <Text style={styles.reviewValue}>{estimatedDays}</Text>
              <Text style={styles.reviewLabel}>Days Worth</Text>
              <Text style={styles.reviewSubtext}>Based on typical portions</Text>
            </View>
          </View>
        </View>

        <View style={styles.optionsSection}>
          <Text style={styles.optionsTitle}>Generation Options</Text>
          
          <View style={styles.optionHeader}>
            <View style={styles.optionTitleContainer}>
              <Text style={styles.optionTitle}>Use Favorite Meals</Text>
              <Text style={styles.optionDescription}>
                Select from your favorite recipes to include
              </Text>
            </View>
            <Switch
              value={preferences.useFavorites}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, useFavorites: value }))}
            />
          </View>
          
          <View style={styles.optionHeader}>
            <View style={styles.optionTitleContainer}>
              <Text style={styles.optionTitle}>Include Leftover Ingredients</Text>
              <Text style={styles.optionDescription}>
                Prioritize recipes using ingredients you already have
              </Text>
            </View>
            <Switch
              value={preferences.useLeftovers}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, useLeftovers: value }))}
            />
          </View>
          
          <View style={styles.optionHeader}>
            <View style={styles.optionTitleContainer}>
              <Text style={styles.optionTitle}>Optimize Ingredients</Text>
              <Text style={styles.optionDescription}>
                Minimize unique ingredients (shorter shopping list)
              </Text>
            </View>
            <Switch
              value={preferences.optimizeIngredients}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, optimizeIngredients: value }))}
            />
          </View>
        </View>

        <View style={styles.generateSection}>
          {preferences.useFavorites && (
            <Text style={styles.generateNote}>
              You'll be able to select your favorite meals next
        </Text>
      )}
          <Pressable 
            style={styles.generateButton}
            onPress={() => {
              if (preferences.useFavorites) {
                // Navigate to favorites selection screen (to be implemented)
                // After selection, it will navigate to meal plan
                navigation.navigate('Meal Plan');
              } else {
                // Direct generation and navigation to meal plan
                navigation.navigate('Meal Plan');
              }
            }}
          >
            <Text style={styles.generateButtonText}>
              {preferences.useFavorites ? 'Continue to Select Meals' : 'Generate & View Meal Plan'}
            </Text>
          </Pressable>
        </View>
    </View>
  );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerAdd}>
        <Pressable 
          style={styles.closeButtonAdd}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitleAdd}>Add Meals</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarWrapperAdd}>
          <View style={[styles.progressFillAdd, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {step} of 3</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      <View style={styles.navigationContainer}>
        {step > 1 && (
          <Pressable 
            style={styles.navigationButton}
            onPress={() => setStep(prev => prev - 1)}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
            <Text style={styles.navigationButtonText}>Back</Text>
          </Pressable>
        )}
        {step < 3 && totalMeals > 0 && (
          <Pressable 
            style={[styles.navigationButton, styles.navigationButtonPrimary]}
            onPress={() => setStep(prev => prev + 1)}
          >
            <Text style={styles.navigationButtonTextPrimary}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  suggestedMealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mealTitleContainer: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  mealSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cookTimeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  cookTimeText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  mealEffortTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  mealEffortText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  pointsSmallTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 4,
    borderRadius: 12,
  },
  pointsSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  mealPlanPreview: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.subtleText,
    textAlign: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  nextMealTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  nextMealText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  foodGroupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  miniTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  nextMealPreview: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  nextMealTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  nextMealDetails: {
    fontSize: 14,
    color: Colors.subtleText,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8E8',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  logoutText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  optionIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  inventoryPreview: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inventoryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  inventoryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  inventoryNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  inventoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  inventoryItems: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 8,
    borderRadius: 8,
  },
  inventoryItemText: {
    fontSize: 12,
    color: Colors.text,
    marginBottom: 4,
  },
  challengeCard: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  energyLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  energyLevelText: {
    fontSize: 12,
    color: Colors.subtleText,
    fontWeight: '500',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  rewardText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  miniEnergyLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  miniEnergyText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '500',
  },
  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  rewardTagText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '600',
  },
  foodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  foodGroupTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  foodGroupText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  timeLeftTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  timeLeftText: {
    fontSize: 11,
    color: '#FF4444',
    fontWeight: '600',
  },
  pointsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  expiringTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  expiringText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF4444',
  },
  pointsMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pointsMiniText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.text,
  },
  addMealsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  addMealsText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  groceryListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  groceryListText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  missingIngredientsText: {
    fontSize: 12,
    color: Colors.subtleText,
    marginTop: 8,
  },
  pointsOverview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  pointsSubtitle: {
    fontSize: 14,
    color: Colors.subtleText,
    marginTop: 2,
  },
  expandButton: {
    padding: 8,
    marginRight: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
  },
  categorySelection: {
    marginBottom: 24,
  },
  categoryPillsContainer: {
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryPillActive: {
    borderColor: 'currentColor',
  },
  categoryPillText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  categoryPillTextActive: {
    fontWeight: '700',
  },
  mealTypeWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  mealTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  mealTypeIcon: {
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 12,
  },
  mealTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  mealTypeStats: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mealTypeStatsText: {
    fontSize: 12,
    color: Colors.subtleText,
    fontWeight: '500',
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recipeTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  recipeSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  servingsText: {
    fontSize: 12,
    color: Colors.subtleText,
  },
  recipeStatusContainer: {
    padding: 4,
  },
  recipeModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  recipeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recipeModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  recipeDetails: {
    flex: 1,
  },
  recipeInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.subtleText,
    marginTop: -8,
    marginBottom: 16,
  },
  progressHeader: undefined,
  progressInfo: undefined,
  progressTitle: undefined,
  progressSubtitle: undefined,
  progressBarContainer: undefined,
  progressBarFillMain: undefined,
  progressBarWrapperAdd: {
    height: 4,
    backgroundColor: Colors.background,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFillAdd: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: Colors.subtleText,
    textAlign: 'center',
  },
  quickOptionsScroll: {
    marginHorizontal: -16,
  },
  quickOptionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  quickOptionCard: {
    width: 160,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  quickOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  quickOptionSubtext: {
    fontSize: 12,
    color: Colors.subtleText,
  },
  timeLeftMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  timeLeftMiniText: {
    fontSize: 10,
    color: '#FF4444',
    fontWeight: '500',
  },
  expiringMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expiringMiniText: {
    fontSize: 10,
    color: '#FF4444',
    fontWeight: '500',
  },
  overallStats: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ingredientStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ingredientText: {
    fontSize: 14,
    color: Colors.text,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  instructionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.text,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  stepContainer: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
  },
  mealTypeWrapperAdd: {  // Renamed from mealTypeWrapper
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  mealTypeHeaderAdd: {  // Renamed from mealTypeHeader
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  mealTypeIconAdd: {  // Renamed from mealTypeIcon
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 12,
  },
  mealTypeTitleAdd: {  // Renamed from mealTypeTitle
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  mealTypeControls: {
    gap: 16,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  counterButton: {
    backgroundColor: Colors.background,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    width: 40,
    textAlign: 'center',
  },
  timeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeOption: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: Colors.primary,
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
  },
  preferenceSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  skillLevelContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  skillLevelOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  skillLevelSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  skillLevelText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  skillLevelTextSelected: {
    color: Colors.primary,
  },
  dietaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryOption: {
    backgroundColor: Colors.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dietarySelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  dietaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  dietaryTextSelected: {
    color: Colors.primary,
  },
  notesInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  favoritesScroll: {
    marginHorizontal: -16,
  },
  favoritesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  favoriteCard: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    width: 160,
  },
  favoriteSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  favoriteTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  favoriteTitleSelected: {
    color: Colors.primary,
  },
  switchContainer: {
    gap: 16,
    marginTop: 8,
  },
  switchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  reviewSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  reviewGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  reviewItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  reviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewLabel: {
    fontSize: 14,
    color: Colors.subtleText,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewTag: {
    backgroundColor: Colors.background,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  reviewTagText: {
    fontSize: 14,
    color: Colors.text,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 32, // Add extra padding at bottom
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  navigationButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  navigationButtonTextPrimary: {
    color: '#FFFFFF',
  },
  suggestionButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  suggestionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  suggestionReason: {
    fontSize: 12,
    color: Colors.subtleText,
  },
  mealTypeTitleContainer: {
    flex: 1,
  },
  mealTypeSubtitle: {
    fontSize: 12,
    color: Colors.subtleText,
    marginTop: 2,
  },
  closeButtonAdd: {  // Renamed from closeButton
    padding: 8,
  },
  headerAdd: {  // Renamed from header
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitleAdd: {  // Renamed from headerTitle
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  mealBreakdown: {
    marginTop: 16,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  breakdownText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionDescription: {
    fontSize: 12,
    color: Colors.subtleText,
    marginTop: 2,
  },
  reviewItemHighlight: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  reviewSubtext: {
    fontSize: 12,
    color: Colors.subtleText,
    textAlign: 'center',
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  breakdownSubtext: {
    fontSize: 12,
    color: Colors.subtleText,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
  },
  breakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownPerDay: {
    fontSize: 12,
    color: Colors.subtleText,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  generateSection: {
    alignItems: 'center',
    gap: 12,
  },
  generateNote: {
    fontSize: 14,
    color: Colors.subtleText,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // New styles for Inventory screen
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  sectionHeaderBase: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  countBadge: {
    backgroundColor: '#E8FFE8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  ingredientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  ingredientQuantity: {
    fontSize: 14,
    color: Colors.subtleText,
  },
  ingredientDetails: {
    gap: 8,
  },
  expiryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FFE8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  usedInContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  usedInLabel: {
    fontSize: 12,
    color: Colors.subtleText,
  },
  mealTag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mealTagText: {
    fontSize: 12,
    color: Colors.text,
  },
  unusedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unusedText: {
    fontSize: 12,
    color: '#FF4444',
  },
  staplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stapleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    width: '48%',
  },
  stapleCardLow: {
    backgroundColor: '#FFF8F8',
  },
  stapleName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  stapleQuantity: {
    fontSize: 12,
    color: Colors.subtleText,
  },
  stapleQuantityLow: {
    color: '#FF4444',
  },
  shoppingHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  shoppingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  shoppingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  shoppingItemUrgent: {
    backgroundColor: '#FFF8F8',
  },
  shoppingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shoppingItemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shoppingItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  shoppingItemQuantity: {
    fontSize: 14,
    color: Colors.subtleText,
  },
  urgentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  urgentText: {
    fontSize: 12,
    color: '#FF4444',
    fontWeight: '500',
  },
  mealsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  mealsLabel: {
    fontSize: 12,
    color: Colors.subtleText,
  },
  exportModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  exportModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 400,
  },
  exportModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginBottom: 12,
  },
  exportOptionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.subtleText,
    fontWeight: '500',
  },
  // Enhanced styles for Available Ingredients
  mainSection: {
    padding: 16,
  },
  sectionHeaderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitleLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  countBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  countTextLarge: {
    fontSize: 18,
    fontWeight: '700',
  },
  ingredientCardEnhanced: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ingredientCardUrgent: {
    backgroundColor: '#FFFAFA',
    borderWidth: 1,
    borderColor: '#FFE8E8',
  },
  ingredientHeaderEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientNameLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  quantityBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  ingredientDetailsEnhanced: {
    gap: 12,
  },
  expiryTagEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FFE8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  expiryTagUrgent: {
    backgroundColor: '#FFE8E8',
  },
  expiryTextEnhanced: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  usedInContainerEnhanced: {
    gap: 8,
  },
  usedInLabelEnhanced: {
    fontSize: 14,
    color: Colors.subtleText,
    fontWeight: '500',
  },
  mealTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTagEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  mealTagTextEnhanced: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  unusedTagEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  unusedTextEnhanced: {
    fontSize: 14,
    color: '#FF4444',
    fontWeight: '600',
  },
  staplesGridEnhanced: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  stapleCardEnhanced: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stapleCardLowEnhanced: {
    backgroundColor: '#FFFAFA',
    borderWidth: 1,
    borderColor: '#FFE8E8',
  },
  stapleIconContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  stapleNameEnhanced: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  stapleQuantityEnhanced: {
    fontSize: 14,
    color: Colors.subtleText,
    textAlign: 'center',
  },
  stapleQuantityLowEnhanced: {
    color: '#FF4444',
    fontWeight: '500',
  },

  // Enhanced styles for Shopping List
  shoppingHeaderEnhanced: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shoppingStatsEnhanced: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statItemEnhanced: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumberLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabelEnhanced: {
    fontSize: 14,
    color: Colors.subtleText,
    fontWeight: '500',
  },
  exportButtonEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  exportButtonTextEnhanced: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categorySection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  categorySubtitle: {
    fontSize: 14,
    color: Colors.subtleText,
    marginTop: 2,
  },
  categoryIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  shoppingItemEnhanced: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shoppingItemUrgentEnhanced: {
    backgroundColor: '#FFFAFA',
    borderWidth: 1,
    borderColor: '#FFE8E8',
  },
  shoppingItemHeaderEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shoppingItemMainEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shoppingItemNameEnhanced: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  quantityBadgeEnhanced: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quantityBadgeUrgent: {
    backgroundColor: '#FFE8E8',
  },
  quantityTextEnhanced: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  urgentTagEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  urgentTextEnhanced: {
    fontSize: 14,
    color: '#FF4444',
    fontWeight: '600',
  },
  mealsContainerEnhanced: {
    gap: 8,
  },
  mealsLabelEnhanced: {
    fontSize: 14,
    color: Colors.subtleText,
    fontWeight: '500',
  },
  mealTagsContainerEnhanced: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTagUrgent: {
    backgroundColor: '#FFF8F8',
  },
  exportModalEnhanced: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  exportModalContentEnhanced: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  exportModalTitleEnhanced: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  exportOptionEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  exportOptionIconContainer: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 12,
  },
  exportOptionTextContainer: {
    flex: 1,
  },
  exportOptionTitleEnhanced: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  exportOptionSubtitle: {
    fontSize: 14,
    color: Colors.subtleText,
  },
  closeButtonEnhanced: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonTextEnhanced: {
    fontSize: 16,
    color: Colors.subtleText,
    fontWeight: '500',
  },
  // New styles for MealPlan
  overviewContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    gap: 24,
  },
  statsGroup: {
    gap: 12,
  },
  statsGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statBoxHighlight: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickStatText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },

  // New styles for Inventory
  sectionHeaderCollapsible: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  headerSpacing: {
    height: 8,
  },
  ingredientCardCompact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  ingredientHeaderCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientNameCompact: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  quantityTextCompact: {
    fontSize: 14,
    color: Colors.subtleText,
  },
  usedInCompact: {
    marginTop: 4,
  },
  usedInTextCompact: {
    fontSize: 12,
    color: Colors.subtleText,
  },
  ingredientList: {
    marginTop: 8,
  },
  // Rename the duplicate sectionHeader styles
  sectionHeaderInventory: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginRight: 16,
    marginLeft: 16,
  },
  sectionHeaderMealPlan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
  },
  // New styles for Inventory
  quickActionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  storageSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  storageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  storageTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storageIconContainer: {
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 12,
  },
  storageSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  storageSectionSubtitle: {
    fontSize: 14,
    color: Colors.subtleText,
  },
  storageContent: {
    padding: 16,
    paddingTop: 0,
  },
  ingredientMainInfo: {
    flex: 1,
  },
  ingredientActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  expiryBadgeUrgent: {
    backgroundColor: '#FFE8E8',
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  expiryTextUrgent: {
    color: '#FF4444',
  },
  exportModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cycleContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  cycleHeader: {
    marginBottom: 16,
  },
  cycleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  cycleSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cycleStep: {
    alignItems: 'center',
    flex: 1,
  },
  cycleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cycleIconActive: {
    backgroundColor: Colors.primary,
  },
  cycleText: {
    fontSize: 12,
    color: Colors.subtleText,
    textAlign: 'center',
  },
  cycleTextActive: {
    color: Colors.primary,
  },
  nextStepsContainer: {
    marginTop: 8,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  nextStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  nextStepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nextStepContent: {
    flex: 1,
  },
  nextStepTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  nextStepDescription: {
    fontSize: 14,
    color: Colors.subtleText,
    lineHeight: 20,
  },
  headerContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.subtleText,
    marginTop: 2,
  },
  overviewTabIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -25,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  overviewTabIconActive: {
    backgroundColor: Colors.primary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxHeight: '80%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  closeModalButton: {
    padding: 8,
    marginRight: -8,
  },
  modalScroll: {
    marginBottom: 16,
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  categoryTabActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryOverview: {
    gap: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 16,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryStats: {
    flex: 1,
  },
  categoryPoints: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  categorySubtext: {
    fontSize: 14,
    color: Colors.subtleText,
  },
  milestonesContainer: {
    gap: 16,
  },
  milestonesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  milestoneCard: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB300',
  },
  milestoneDescription: {
    fontSize: 14,
    color: Colors.subtleText,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.subtleText,
    textAlign: 'right',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  settingsSection: {
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginBottom: 16,
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  settingsSectionSubtitle: {
    fontSize: 14,
    color: Colors.subtleText,
    marginBottom: 16,
  },
  measurementOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  measurementOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  measurementOptionActive: {
    backgroundColor: Colors.primary,
  },
  measurementOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  measurementOptionTextActive: {
    color: '#FFFFFF',
  },
  allergensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  allergenChipActive: {
    backgroundColor: Colors.primary,
  },
  allergenChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  allergenChipTextActive: {
    color: '#FFFFFF',
  },
  appliancesList: {
    gap: 12,
  },
  applianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  applianceItemActive: {
    backgroundColor: '#E8FFE8',
  },
  applianceText: {
    fontSize: 16,
    color: Colors.text,
  },
  applianceTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsPreview: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsPreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  settingsPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsPreviewItem: {
    marginBottom: 16,
  },
  settingsPreviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsPreviewInfo: {
    flex: 1,
  },
  settingsPreviewLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  settingsPreviewValue: {
    fontSize: 14,
    color: Colors.subtleText,
  },
  settingsPreviewHint: {
    fontSize: 14,
    color: Colors.subtleText,
    textAlign: 'center',
    marginTop: 12,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  overviewIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    width: 58,
    marginTop: -32,
  },
  overviewIconBackground: {
    backgroundColor: Colors.primary,
    height: '100%',
    width: '100%',
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mealPlanProgress: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: undefined,
  progressTitle: undefined,
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.subtleText,
    marginTop: 2,
  },
  actionItems: {
    marginTop: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  actionList: {
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  actionPoints: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statSubtext: {
    fontSize: 12,
    color: Colors.subtleText,
    marginTop: 2,
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickStatContent: {
    flex: 1,
  },
  quickStatNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  categorySelection: {
    marginBottom: 24,
  },
  categoryPills: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  categoryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPillActive: {
    borderColor: 'currentColor',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    fontWeight: '700',
  },
  pointsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  pointsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsTextContainer: {
    flex: 1,
  },
  pointsNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  pointsLabel: {
    fontSize: 14,
    color: Colors.text,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 8,
  },
  sectionSpacer: {
    height: 24,
  },
  editMealPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  editMealPlanText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNavBar, setShowNavBar] = useState(true);

  const authContext = React.useMemo(
    () => ({
      signOut: () => {
        setIsAuthenticated(false);
      },
      isAuthenticated,
    }),
    [isAuthenticated]
  );
    
    return (
    <AuthContext.Provider value={authContext}>
      <NavVisibilityContext.Provider value={{ showNavBar, setShowNavBar }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {!isAuthenticated ? (
                <Stack.Screen name="Login">
                  {props => <LoginScreen onLogin={() => setIsAuthenticated(true)} />}
                </Stack.Screen>
              ) : (
                <Stack.Screen name="Main" component={TabNavigator} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </NavVisibilityContext.Provider>
    </AuthContext.Provider>
  );
} 