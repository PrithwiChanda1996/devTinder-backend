# Bug Fix: Corrected User ID Property Name

## 🐛 Issue Identified

The connections controller was using the wrong property name to access the user ID from the JWT token payload.

### Problem
- **Wrong**: `user.userId`
- **Correct**: `user.id`

### Root Cause

The JWT strategy (`src/auth/strategies/jwt.strategy.ts`) returns:
```typescript
return {
  id: payload.id,        // ✅ Using 'id'
  username: payload.username,
  email: payload.email,
};
```

But the connections controller was accessing `user.userId` instead of `user.id`.

## ✅ Fix Applied

### Controller Pattern Updated

**Before:**
```typescript
async sendConnectionRequest(
  @CurrentUser() user: any,
  @Body() sendConnectionRequestDto: SendConnectionRequestDto,
) {
  const connection = await this.connectionsService.sendConnectionRequest(
    user.userId,  // ❌ Wrong property
    sendConnectionRequestDto.toUserId,
  );
}
```

**After:**
```typescript
async sendConnectionRequest(
  @CurrentUser('id') userId: string,  // ✅ Direct extraction
  @Body() sendConnectionRequestDto: SendConnectionRequestDto,
) {
  const connection = await this.connectionsService.sendConnectionRequest(
    userId,  // ✅ Correct
    sendConnectionRequestDto.toUserId,
  );
}
```

### Consistency with Other Controllers

Now follows the same pattern as `auth.controller.ts` and `users.controller.ts`:
```typescript
// auth.controller.ts
async logoutAllDevices(
  @CurrentUser('id') userId: string,  // ✅ Same pattern
  @Res({ passthrough: true }) res: Response,
) { ... }

// users.controller.ts  
async updateProfile(
  @CurrentUser('id') userId: string,  // ✅ Same pattern
  @Body() updateUserDto: UpdateUserDto,
) { ... }
```

## 📝 Files Modified

### 1. `src/connections/connections.controller.ts`
Updated all 10 endpoints to use `@CurrentUser('id') userId: string`:
- ✅ sendConnectionRequest
- ✅ acceptConnection
- ✅ rejectConnection
- ✅ cancelRequest
- ✅ blockUser
- ✅ unblockUser
- ✅ getReceivedRequests
- ✅ getSentRequests
- ✅ getConnections
- ✅ getConnectionStatus

### 2. `src/connections/connections.controller.spec.ts`
Updated all test cases to match:
- Changed `mockUser = { userId: '...' }` to `mockUserId = '...'`
- Updated all test method calls to pass `mockUserId` instead of `mockUser`
- Updated all assertions to check `mockUserId` instead of `mockUser.userId`

## ✅ Verification

### Tests
```bash
npm test -- --testPathPatterns=connections
```
**Result**: ✅ All 54 tests passing

### No Linter Errors
```bash
# Checked src/connections directory
```
**Result**: ✅ No errors found

### Server Started Successfully
```bash
npm run start:dev
```
**Result**: ✅ Server running on http://localhost:3000

## 🎯 Impact

### Before Fix
- ❌ All connection endpoints would fail with undefined or null user ID
- ❌ Operations would not execute correctly
- ❌ Authorization checks would fail

### After Fix
- ✅ User ID correctly extracted from JWT token
- ✅ All connection operations work as expected
- ✅ Consistent with other controllers
- ✅ Type-safe with TypeScript

## 📊 Summary

| Aspect | Status |
|--------|--------|
| Issue Identified | ✅ |
| Root Cause Found | ✅ |
| Fix Applied | ✅ |
| Tests Updated | ✅ |
| All Tests Passing | ✅ 54/54 |
| Linter Errors | ✅ 0 |
| Server Running | ✅ |
| Consistent with Codebase | ✅ |

## 🙏 Credits

Issue spotted by: **User Review**
Fixed by: **AI Assistant**
Pattern reference: `auth.controller.ts` and `users.controller.ts`

---

**Date**: November 22, 2024
**Status**: ✅ Fixed and Verified
**Breaking Changes**: None (was already broken, now fixed)

