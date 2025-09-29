# 🧾 Ezpense - Expense tracking made EZ

An AI-powered expense manager with receipt scanning built with Next.js and KendoReact components.

## 🚀 Features

- **📤 Receipt Upload**: Drag & drop interface for uploading receipt images
- **🤖 AI Processing**: Automatic data extraction from receipts using AI
- **✏️ Review & Edit**: Review and edit AI-extracted data before saving
- **📊 Dashboard**: Visual analytics and spending insights
- **💰 Expense Management**: Comprehensive expense tracking with filtering
- **⚙️ Settings**: Customizable categories, budgets, and preferences

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: KendoReact (10+ components used)
- **Styling**: Tailwind CSS
- **Database**: Supabase (with anonymous authentication)
- **AI**: OpenAI API for receipt processing

## 🎯 KendoReact Components Used

- **Card**: Layout and content organization
- **Button**: Action buttons throughout the app
- **Grid**: Data display for expenses
- **TextBox/NumericTextBox**: Form inputs
- **DropDownList**: Category and filter selection
- **DatePicker/DateRangePicker**: Date selection
- **ProgressBar**: Upload progress and budget tracking
- **Badge**: Status indicators
- **Notification**: Success/error messages
- **Dialog**: Modals and confirmations
- **Switch**: Toggle settings

## 🏃‍♂️ Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Pages

- **Dashboard** (`/`): Overview with analytics and quick actions
- **Upload** (`/upload`): Drag & drop receipt upload with AI processing
- **Review** (`/review`): Edit and confirm AI-extracted data
- **Expenses** (`/expenses`): View and manage all expenses
- **Settings** (`/settings`): Configure categories, budgets, and preferences

## 🎨 Design Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface with KendoReact components
- **Accessibility**: WCAG 2.1 AA compliant components
- **Dark/Light Theme**: Theme switching support
- **Real-time Updates**: Live progress indicators and notifications

## 🔧 Configuration

The app uses anonymous authentication with Supabase, so users can start using it immediately without registration.

## 📊 Mock Data

The application includes comprehensive mock data to demonstrate all features:
- Sample receipts with AI-extracted data
- Expense categories and budgets
- Spending analytics and trends
- User preferences and settings

## 🚀 Deployment

This project is ready for deployment on Vercel, Netlify, or any Next.js-compatible platform.

## 📝 License

This project is created for hackathon demonstration purposes.
