"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function ManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for the current money amounts in both currencies
  const [balanceBDT, setBalanceBDT] = useState(0);
  const [balanceUSD, setBalanceUSD] = useState(0);

  // State for the input amount
  const [inputAmount, setInputAmount] = useState("");

  // State for the transaction description
  const [description, setDescription] = useState("");

  // State for the conversion rates
  const [conversionRates] = useState({
    BDT_TO_USD: 0.0082,
    USD_TO_BDT: 122.20
  });

  // State to store all transactions
  const [transactions, setTransactions] = useState([]);

  // State for selected currency
  const [selectedCurrency, setSelectedCurrency] = useState("BDT");

  // State for display currency
  const [displayCurrency, setDisplayCurrency] = useState("BDT");

  // State for loading
  const [isLoading, setIsLoading] = useState(true);

  // State for modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [modalData, setModalData] = useState({});

  // Fetch user data and transactions on mount
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch balance
      const balanceRes = await fetch('/api/user/balance');
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalanceBDT(balanceData.balanceBDT);
        setBalanceUSD(balanceData.balanceUSD);
      }
      
      // Fetch transactions
      const transactionsRes = await fetch('/api/transactions');
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Handle logout with modal confirmation
  const handleLogout = () => {
    setModalAction('logout');
    setShowConfirmModal(true);
  };

  const confirmLogout = async () => {
    setShowConfirmModal(false);
    const toastId = toast.loading('Logging out...');
    await signOut({ callbackUrl: "/" });
    toast.dismiss(toastId);
    toast.success('Logged out successfully');
  };

  // Get current balance based on selected currency
  const getCurrentBalance = () => {
    return selectedCurrency === "BDT" ? balanceBDT : balanceUSD;
  };

  // Update balance in database
  const updateBalanceInDB = async (newBalanceBDT, newBalanceUSD) => {
    try {
      const response = await fetch('/api/user/balance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          balanceBDT: newBalanceBDT,
          balanceUSD: newBalanceUSD
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update balance');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  };

  // Save transaction to database
  const saveTransactionToDB = async (transactionData) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error('Failed to save transaction');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  };

  // Handle adding money
  const handleAddMoney = async () => {
    const amount = parseFloat(inputAmount);

    // Validation
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description for this transaction");
      return;
    }

    setIsLoading(true);

    try {
      // Calculate amounts in both currencies
      let bdtAmount, usdAmount;
      
      if (selectedCurrency === "BDT") {
        bdtAmount = amount;
        usdAmount = amount * conversionRates.BDT_TO_USD;
      } else {
        usdAmount = amount;
        bdtAmount = amount * conversionRates.USD_TO_BDT;
      }

      const newBalanceBDT = balanceBDT + bdtAmount;
      const newBalanceUSD = balanceUSD + usdAmount;

      // Update database balance
      await updateBalanceInDB(newBalanceBDT, newBalanceUSD);

      // Save transaction to database
      const transactionData = {
        type: "add",
        amount,
        usdAmount,
        bdtAmount,
        currency: selectedCurrency,
        description: description.trim(),
        timestamp: new Date().toISOString(),
      };

      await saveTransactionToDB(transactionData);

      // Update local state
      setBalanceBDT(newBalanceBDT);
      setBalanceUSD(newBalanceUSD);
      
      // Refresh transactions list
      await fetchUserData();

      setInputAmount("");
      setDescription("");
      
      // Show success toast
      toast.success(
        <div>
          <p className="font-semibold">Money Added Successfully!</p>
          <p className="text-sm">
            +{amount.toFixed(2)} {selectedCurrency}
          </p>
        </div>,
        {
          duration: 3000,
          icon: '💰',
          style: {
            background: '#10B981',
            color: 'white',
          }
        }
      );
    } catch (error) {
      console.error('Error adding money:', error);
      toast.error('Failed to add money. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle subtracting money
  const handleMinusMoney = async () => {
    const amount = parseFloat(inputAmount);

    // Validation
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description for this transaction");
      return;
    }

    // Check if sufficient funds in selected currency
    const currentBalance = getCurrentBalance();
    if (amount > currentBalance) {
      toast.error(
        <div>
          <p className="font-semibold">Insufficient Funds!</p>
          <p className="text-sm">
            You only have {currentBalance.toFixed(2)} {selectedCurrency}
          </p>
        </div>,
        {
          duration: 4000,
          icon: '⚠️'
        }
      );
      return;
    }

    setIsLoading(true);

    try {
      // Calculate amounts in both currencies
      let bdtAmount, usdAmount;
      
      if (selectedCurrency === "BDT") {
        bdtAmount = amount;
        usdAmount = amount * conversionRates.BDT_TO_USD;
      } else {
        usdAmount = amount;
        bdtAmount = amount * conversionRates.USD_TO_BDT;
      }

      const newBalanceBDT = balanceBDT - bdtAmount;
      const newBalanceUSD = balanceUSD - usdAmount;

      // Update database balance
      await updateBalanceInDB(newBalanceBDT, newBalanceUSD);

      // Save transaction to database
      const transactionData = {
        type: "minus",
        amount,
        usdAmount,
        bdtAmount,
        currency: selectedCurrency,
        description: description.trim(),
        timestamp: new Date().toISOString(),
      };

      await saveTransactionToDB(transactionData);

      // Update local state
      setBalanceBDT(newBalanceBDT);
      setBalanceUSD(newBalanceUSD);
      
      // Refresh transactions list
      await fetchUserData();

      setInputAmount("");
      setDescription("");
      
      // Show success toast
      toast.success(
        <div>
          <p className="font-semibold">Money Subtracted Successfully!</p>
          <p className="text-sm">
            -{amount.toFixed(2)} {selectedCurrency}
          </p>
        </div>,
        {
          duration: 3000,
          icon: '💸',
          style: {
            background: '#EF4444',
            color: 'white',
          }
        }
      );
    } catch (error) {
      console.error('Error subtracting money:', error);
      toast.error('Failed to subtract money. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch currency
  const handleSwitchCurrency = () => {
    const newCurrency = selectedCurrency === "BDT" ? "USD" : "BDT";
    setSelectedCurrency(newCurrency);
    toast.success(`Switched to ${newCurrency}`);
  };

  // Toggle display currency
  const handleToggleDisplayCurrency = () => {
    const newDisplay = displayCurrency === "BDT" ? "USD" : "BDT";
    setDisplayCurrency(newDisplay);
    toast.success(`Now displaying in ${newDisplay}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + " - " + date.toLocaleDateString();
  };

  // Clear all transactions with modal confirmation
  const handleClearTransactions = () => {
    setModalAction('clearTransactions');
    setShowConfirmModal(true);
  };

  const confirmClearTransactions = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'DELETE',
      });

      if (response.ok) {
        setTransactions([]);
        toast.success('All transactions cleared successfully!');
      } else {
        throw new Error('Failed to clear transactions');
      }
    } catch (error) {
      console.error('Error clearing transactions:', error);
      toast.error('Failed to clear transactions');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear current balance with modal confirmation
  const handleClearBalance = () => {
    setModalAction('clearBalance');
    setShowConfirmModal(true);
  };

  const confirmClearBalance = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    try {
      await updateBalanceInDB(0, 0);
      setBalanceBDT(0);
      setBalanceUSD(0);
      toast.success('Balance reset to zero successfully!');
    } catch (error) {
      console.error('Error resetting balance:', error);
      toast.error('Failed to reset balance');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick amount buttons handler
  const handleQuickAmount = (amount) => {
    setInputAmount(amount.toString());
    setDescription(`Quick ${selectedCurrency === "BDT" ? "BDT" : "USD"} Add - ${amount}`);
    toast.success(`Amount set to ${amount} ${selectedCurrency}`);
  };

  // Get display amounts
  const currentBalance = getCurrentBalance();
  const displayBalance = displayCurrency === "BDT" ? balanceBDT : balanceUSD;

  // Modal content based on action
  const getModalContent = () => {
    switch (modalAction) {
      case 'logout':
        return {
          title: 'Confirm Logout',
          message: 'Are you sure you want to logout?',
          confirmText: 'Yes, Logout',
          confirmColor: 'bg-red-500 hover:bg-red-600',
        };
      case 'clearTransactions':
        return {
          title: 'Clear All Transactions',
          message: 'Are you sure you want to clear all transaction history? This action cannot be undone.',
          confirmText: 'Yes, Clear All',
          confirmColor: 'bg-red-500 hover:bg-red-600',
        };
      case 'clearBalance':
        return {
          title: 'Reset Balance',
          message: 'Are you sure you want to reset your balance to zero? This action cannot be undone.',
          confirmText: 'Yes, Reset Balance',
          confirmColor: 'bg-red-500 hover:bg-red-600',
        };
      default:
        return {
          title: 'Confirm Action',
          message: 'Are you sure you want to proceed?',
          confirmText: 'Confirm',
          confirmColor: 'bg-blue-500 hover:bg-blue-600',
        };
    }
  };

  const modalContent = getModalContent();

  // Handle modal confirmation
  const handleModalConfirm = () => {
    switch (modalAction) {
      case 'logout':
        confirmLogout();
        break;
      case 'clearTransactions':
        confirmClearTransactions();
        break;
      case 'clearBalance':
        confirmClearBalance();
        break;
      default:
        setShowConfirmModal(false);
    }
  };

  // Show loading while checking authentication or loading data
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
          error: {
            duration: 4000,
          },
          loading: {
            duration: Infinity,
          },
        }}
      />

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {modalContent.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {modalContent.message}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModalConfirm}
                className={`px-4 py-2 text-white ${modalContent.confirmColor} rounded-lg transition-colors`}
              >
                {modalContent.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen flex-col items-center justify-between py-8 px-4 bg-white dark:bg-black sm:px-8 sm:py-16">
          
          {/* Header with User Info and Logout */}
          <div className="w-full max-w-7xl mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {session.user?.name?.[0] || "U"}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Welcome, {session.user?.name || "User"}!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Money Management Interface */}
          <div className="w-11/12 mx-auto space-y-8">
            <div className="grid lg:grid-cols-3 grid-cols gap-8 grid-rows-1">
              {/* Balance Display Section */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-8 dark:from-gray-900 dark:to-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                      Current Balance
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${selectedCurrency === "BDT" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
                        BDT
                      </span>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${selectedCurrency === "USD" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
                        USD
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleClearBalance}
                      className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      Reset Balance
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Primary Balance Display */}
                  <div className="p-6 bg-white/50 dark:bg-black/20 rounded-xl">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {selectedCurrency} Balance
                        </p>
                        <span className="text-5xl font-bold text-gray-900 dark:text-white">
                          {currentBalance.toFixed(2)} {selectedCurrency}
                        </span>
                      </div>
                      <button
                        onClick={handleToggleDisplayCurrency}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {displayCurrency === "BDT" ? "USD" : "BDT"}
                      </button>
                    </div>

                    {/* Secondary Balance Display */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {displayCurrency === "BDT" ? "BDT" : "USD"} Balance
                          </p>
                          <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                            {displayCurrency === "BDT"
                              ? `${balanceBDT.toFixed(2)} BDT`
                              : `$${balanceUSD.toFixed(2)} USD`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conversion Rates Info */}
                  <div className="pt-4 text-sm text-gray-600 dark:text-gray-400 bg-white/30 dark:bg-black/10 p-4 rounded-lg hidden lg:block">
                    <p className="font-medium mb-2">Conversion Rates:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <span>1 BDT =</span>
                        <span className="font-semibold">${conversionRates.BDT_TO_USD.toFixed(4)} USD</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>1 USD =</span>
                        <span className="font-semibold">{conversionRates.USD_TO_BDT.toFixed(2)} BDT</span>
                      </div>
                    </div>
                    <p className="mt-2">Total Transactions: {transactions.length}</p>
                  </div>
                </div>
              </div>

              {/* Money Control Section */}
              <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
                  Money Operations
                </h2>

                <div className="space-y-6">
                  {/* Currency Indicator */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${selectedCurrency === "BDT" ? "bg-blue-500" : "bg-green-500"}`}></div>
                        <span className="font-medium">Current Currency: {selectedCurrency}</span>
                      </div>
                      <button
                        onClick={handleSwitchCurrency}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Switch to {selectedCurrency === "BDT" ? "USD" : "BDT"}
                      </button>
                    </div>
                  </div>

                  {/* Input Section */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter Amount ({selectedCurrency}) *
                      </label>
                      <input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={inputAmount}
                        onChange={(e) => setInputAmount(e.target.value)}
                        placeholder={`0.00 ${selectedCurrency}`}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {inputAmount && (
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <div className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <p className="text-gray-500 dark:text-gray-400">BDT Equivalent</p>
                            <p className="font-medium">
                              {selectedCurrency === "BDT" 
                                ? parseFloat(inputAmount).toFixed(2)
                                : (parseFloat(inputAmount) * conversionRates.USD_TO_BDT).toFixed(2)
                              }
                            </p>
                          </div>
                          <div className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <p className="text-gray-500 dark:text-gray-400">USD Equivalent</p>
                            <p className="font-medium">$
                              {selectedCurrency === "USD"
                                ? parseFloat(inputAmount).toFixed(2)
                                : (parseFloat(inputAmount) * conversionRates.BDT_TO_USD).toFixed(2)
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Transaction Description *
                      </label>
                      <input
                        id="description"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Salary, Groceries, Shopping, etc."
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Required field. Briefly describe this transaction.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleAddMoney}
                      className="flex-1 px-3 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Money
                    </button>
                    <button
                      onClick={handleMinusMoney}
                      className="flex-1 px-3 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                      Minus Money
                    </button>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quick Amounts ({selectedCurrency})
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedCurrency === "BDT" ? (
                        <>
                          <button
                            onClick={() => handleQuickAmount(10)}
                            className="px-1 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            10 BDT
                          </button>
                          <button
                            onClick={() => handleQuickAmount(50)}
                            className="px-1 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            50 BDT
                          </button>
                          <button
                            onClick={() => handleQuickAmount(100)}
                            className="px-1 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            100 BDT
                          </button>
                          <button
                            onClick={() => handleQuickAmount(500)}
                            className="px-1 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            500 BDT
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleQuickAmount(1)}
                            className="px-1 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            $1
                          </button>
                          <button
                            onClick={() => handleQuickAmount(5)}
                            className="px-1 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            $5
                          </button>
                          <button
                            onClick={() => handleQuickAmount(10)}
                            className="px-1 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            $10
                          </button>
                          <button
                            onClick={() => handleQuickAmount(50)}
                            className="px-1 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            $50
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions History */}
              <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    Transaction History 
                    <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">({transactions.length})</p>
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleClearTransactions}
                      className="px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Clear History
                    </button>
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No transactions yet. Add or subtract money to see history here.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction._id}
                        className={`p-4 rounded-lg border ${transaction.type === "add"
                          ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                          : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20"
                          }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-block w-3 h-3 rounded-full ${transaction.type === "add" ? "bg-green-500" : "bg-red-500"
                                }`}></span>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {transaction.type === "add" ? "Money Added" : "Money Subtracted"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(transaction.timestamp)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${transaction.type === "add"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                              }`}>
                              {transaction.type === "add" ? "+" : "-"} {transaction.amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.bdtAmount.toFixed(2)} BDT | ${transaction.usdAmount.toFixed(2)} USD
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description:
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {transaction.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hidden lg:block">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        💡 All your data is securely stored in the database.
                        You can access your account from any device.
                        Transactions are saved automatically.
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        * Conversion Rates: 1 BDT = ${conversionRates.BDT_TO_USD} USD | 1 USD = {conversionRates.USD_TO_BDT} BDT
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}