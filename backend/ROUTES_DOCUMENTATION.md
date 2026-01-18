# AlgoVerse API Routes Documentation

## 🚀 **Base URL**: `https://algoverse-kpwz.onrender.com`

## 🔐 **Authentication Routes** (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/request-email-otp` - Request OTP for email change
- `POST /auth/verify-email-otp` - Verify OTP and update email
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/verify-password-otp` - Verify OTP for password reset
- `POST /auth/reset-password` - Reset password with OTP

## 👤 **User Routes** (`/users`)
- `GET /users/` - Get all users
- `GET /users/{user_id}` - Get user by ID
- `POST /users/` - Create new user
- `GET /users/{user_id}/profile` - Get user profile with progress
- `GET /users/{user_id}/public` - **Get public user profile** ✅
- `PUT /users/{user_id}/make-admin` - Make user admin (admin only)
- `DELETE /users/{user_id}` - Delete user (admin only)

## 👤 **Profile Routes** (`/profile`)
- `GET /profile/me` - Get current user profile
- `PUT /profile/update-password` - Update password
- `PUT /profile/update-email` - Update email
- `PUT /profile/update-name` - Update name
- `DELETE /profile/delete` - Delete account
- `GET /profile/stats` - Get user statistics
- `POST /profile/request-email-otp` - Request OTP for email change
- `POST /profile/verify-email-otp` - Verify OTP and update email
- `GET /profile/my-blogs` - Get user's blogs
- `GET /profile/my-progress` - Get user's algorithm progress

## 📊 **User Progress Routes** (`/user_progress`)
- `GET /user_progress/` - Get all user progress
- `POST /user_progress/` - Create progress entry
- `PUT /user_progress/{progress_id}` - Update progress
- `DELETE /user_progress/{progress_id}` - Delete progress

## 🧮 **Algorithm Routes** (`/algorithms`)
- `GET /algorithms/` - Get all algorithms
- `GET /algorithms/{algo_id}` - Get algorithm by ID
- `POST /algorithms/` - Create algorithm (admin)
- `PUT /algorithms/{algo_id}` - Update algorithm (admin)
- `DELETE /algorithms/{algo_id}` - Delete algorithm (admin)

## 📚 **Algorithm Types Routes** (`/algo_types`)
- `GET /algo_types/` - Get all algorithm types
- `GET /algo_types/{type_id}` - Get algorithm type by ID
- `POST /algo_types/` - Create algorithm type (admin)
- `PUT /algo_types/{type_id}` - Update algorithm type (admin)
- `DELETE /algo_types/{type_id}` - Delete algorithm type (admin)

## 📝 **Blog Routes** (`/blog`)
- `GET /blog/` - Get all blogs
- `GET /blog/{blog_id}` - Get blog by ID
- `POST /blog/` - Create blog
- `PUT /blog/{blog_id}` - Update blog
- `DELETE /blog/{blog_id}` - Delete blog

## 💬 **Comment Routes** (`/comments`)
- `GET /comments/` - Get all comments
- `GET /comments/{comment_id}` - Get comment by ID
- `POST /comments/` - Create comment
- `PUT /comments/{comment_id}` - Update comment
- `DELETE /comments/{comment_id}` - Delete comment

## 🔧 **Admin Routes** (`/admin`)
- `GET /admin/users/` - Get all users (admin)
- `PUT /admin/users/{user_id}/make-admin` - Make user admin (admin)
- `DELETE /admin/users/{user_id}` - Delete user (admin)
- `GET /admin/algo-types/` - Manage algorithm types (admin)
- `GET /admin/algorithms/` - Manage algorithms (admin)
- `GET /admin/progress/` - Manage user progress (admin)
- `GET /admin/blogs/` - Manage blogs (admin)
- `GET /admin/dashboard/` - Admin dashboard

## 🏆 **Contest Routes** (`/api/contests`)
- `GET /api/contests/` - Get contests
- `GET /api/contests/upcoming` - Get upcoming contests
- `GET /api/contests/running` - Get running contests

## 🔍 **Health & Test Routes**
- `GET /health` - Health check endpoint
- `GET /` - Root endpoint (API is running)
- `GET /test-db` - Test database connection
- `GET /test-auth` - Test authentication

## 📊 **User Progress Routes** (`/user_progress`)
- `GET /user_progress/` - Get all user progress
- `POST /user_progress/` - Create progress entry
- `PUT /user_progress/{progress_id}` - Update progress
- `DELETE /user_progress/{progress_id}` - Delete progress

## 🧮 **Algorithm Comments Routes** (`/algorithm_comments`)
- `GET /algorithm_comments/{algorithm_id}` - Get all comments for algorithm
- `POST /algorithm_comments/` - Create comment on algorithm
- `PUT /algorithm_comments/{comment_id}` - Update comment
- `DELETE /algorithm_comments/{comment_id}` - Delete comment

## 📝 **Algorithm Routes** (`/algorithms`)
- `GET /algorithms/` - Get all algorithms
- `POST /algorithms/` - Create algorithm (admin)
- `GET /algorithms/{algo_id}` - Get algorithm by ID
- `PUT /algorithms/{algo_id}` - Update algorithm (admin)
- `DELETE /algorithms/{algo_id}` - Delete algorithm (admin)

## 🗂️ **Contest Routes** (`/api/contests`)
- `GET /api/contests/` - Get all contests
- `GET /api/contests/upcoming` - Get upcoming contests
- `GET /api/contests/running` - Get running contests

## 🛠️ **Admin Dashboard Routes** (`/admin`)
- `GET /admin/dashboard/` - Admin dashboard overview
- `GET /admin/users/` - User management (admin)
- `PUT /admin/users/{user_id}/make-admin` - Grant admin privileges
- `DELETE /admin/users/{user_id}` - Delete user (admin)
- `GET /admin/algo-types/` - Algorithm type management (admin)
- `GET /admin/algorithms/` - Algorithm management (admin)
- `GET /admin/progress/` - User progress management (admin)
- `GET /admin/blogs/` - Blog management (admin)
- `GET /admin/dashboard/admin-info` - Admin dashboard stats

## 📝 **Blog Routes** (`/blog`)
- `GET /blog/` - Get all blogs
- `GET /blog/{blog_id}` - Get blog by ID
- `POST /blog/` - Create blog
- `PUT /blog/{blog_id}` - Update blog
- `DELETE /blog/{blog_id}` - Delete blog

## 💬 **Comment Routes** (`/comments`)
- `GET /comments/` - Get all comments
- `GET /comments/{comment_id}` - Get comment by ID
- `POST /comments/` - Create comment
- `PUT /comments/{comment_id}` - Update comment
- `DELETE /comments/{comment_id}` - Delete comment

## 🔧 **Related Problems Routes** (`/related_problems`)
- `GET /related-problems/` - Get related problems
- `POST /related-problems/` - Create related problem
- `GET /related-problems/{problem_id}` - Get related problem by ID
- `PUT /related-problems/{problem_id}` - Update related problem
- `DELETE /related-problems/{problem_id}` - Delete related problem

### 🌐 **Frontend Integration Examples**

**Admin Dashboard Components**:
```javascript
// User Management
const users = await adminService.fetchUsers();
const makeAdmin = async (userId) => await adminService.makeAdmin(userId);

// Algorithm Management  
const algorithms = await adminService.fetchAlgorithms();
const createAlgorithm = async (data) => await adminService.createAlgorithm(data);

// Blog Management
const blogs = await adminService.fetchBlogs();
const moderateBlog = async (blogId, data) => await adminService.updateBlogStatus(blogId, data);

// User Progress
const progress = await adminService.fetchUserProgress();
const createProgress = async (data) => await adminService.createProgress(data);

// Dashboard Stats
const stats = await adminService.fetchDashboardStats();
```

**API Service Integration**:
```javascript
// All admin operations use centralized API
import { adminService } from '../services/adminService';

// Example: Fetch all users
const users = await adminService.fetchUsers();

// Example: Create algorithm
const algorithm = await adminService.createAlgorithm({
  name: "Binary Search",
  difficulty: "medium",
  description: "Efficient binary search algorithm",
  code: "binary_search.js"
  type_id: 1
});
```

### 🎯 **All Routes Status Summary**

| **Route Group** | **Total Routes** | **Status** | **Notes** |
|---|---|---|---|
| Authentication | 4 | ✅ Working | Login, register, OTP, password reset |
| Users | 3 | ✅ Working | Public profile, CRUD operations |
| Profile | 3 | ✅ Working | Profile management, settings, stats |
| User Progress | 4 | ✅ Working | Progress tracking, CRUD operations |
| Algorithms | 5 | ✅ Working | CRUD operations, type management |
| Algorithm Types | 4 | ✅ Working | CRUD operations |
| Blog | 4 | ✅ Working | CRUD operations, moderation |
| Comments | 3 | ✅ Working | CRUD operations |
| Related Problems | 3 | ✅ Working | CRUD operations |
| Contests | 3 | ✅ Working | Contest data from multiple platforms |
| Admin | 8 | ✅ Working | Full dashboard, user management, content moderation |

### 🚀 **Production Ready**

All admin routes are fully functional and integrated into the frontend dashboard with:

- ✅ **Proper Authentication**: OAuth2 with role-based access
- ✅ **Centralized API**: Environment-based URL configuration
- ✅ **Complete CRUD**: Create, read, update, delete for all entities
- ✅ **Real-time Stats**: Dashboard analytics and monitoring
- ✅ **Content Moderation**: Blog approval workflow
- ✅ **Bulk Operations**: Efficient batch processing
- ✅ **Error Handling**: Comprehensive error responses and logging

**Admin users can now:**
- Manage all platform users and permissions
- Monitor real-time statistics and analytics
- Manage algorithms and learning content
- Moderate blogs and user-generated content
- Track user progress and engagement
- Access comprehensive admin dashboard with full system control

**The admin system is production-ready and fully integrated!** 🎉
- **Admin Dashboard**: `https://algo-verse-eight.vercel.app/admin`

## ❌ **Common Issues & Solutions**

### Issue: Public profile not loading
**Wrong URL**: `/users/7`
**Correct URL**: `/users/7/public`

### Issue: Codeforces handle update not refreshing
**Problem**: Component doesn't refresh user data after update
**Solution**: Add `setUserInfo(updatedUser)` after successful update

### Issue: Admin routes not working
**Check**: User must have `is_admin: true` in database
**Solution**: Verify admin permissions in database
