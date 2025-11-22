import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { ConnectionsService } from "./connections.service";
import { SendConnectionRequestDto } from "./dto/send-connection-request.dto";
import {
  ConnectionResponseDto,
  ConnectionStatusResponseDto,
} from "./dto/connection-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("connections")
@ApiBearerAuth("JWT-auth")
@Controller("connections")
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post("send")
  @ApiOperation({
    summary: "Send connection request",
    description: "Send a connection request to another user",
  })
  @ApiResponse({
    status: 201,
    description: "Connection request sent successfully",
    type: ConnectionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid user ID or sending to self",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Blocked user",
  })
  @ApiResponse({
    status: 404,
    description: "Target user not found",
  })
  @ApiResponse({
    status: 409,
    description: "Conflict - Connection already exists or request already sent",
  })
  async sendConnectionRequest(
    @CurrentUser("id") userId: string,
    @Body() sendConnectionRequestDto: SendConnectionRequestDto
  ) {
    const connection = await this.connectionsService.sendConnectionRequest(
      userId,
      sendConnectionRequestDto.toUserId
    );

    return {
      message: "Connection request sent successfully",
      data: connection,
    };
  }

  @Patch(":id/accept")
  @ApiOperation({
    summary: "Accept connection request",
    description:
      "Accept a pending connection request (only receiver can accept)",
  })
  @ApiParam({
    name: "id",
    description: "Connection request ID",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({
    status: 200,
    description: "Connection request accepted successfully",
    type: ConnectionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid ID format or connection not pending",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Not authorized to accept this request",
  })
  @ApiResponse({
    status: 404,
    description: "Connection request not found",
  })
  async acceptConnection(
    @CurrentUser("id") userId: string,
    @Param("id") connectionId: string
  ) {
    const connection = await this.connectionsService.acceptConnection(
      connectionId,
      userId
    );

    return {
      message: "Connection request accepted successfully",
      data: connection,
    };
  }

  @Patch(":id/reject")
  @ApiOperation({
    summary: "Reject connection request",
    description:
      "Reject a pending connection request (only receiver can reject)",
  })
  @ApiParam({
    name: "id",
    description: "Connection request ID",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({
    status: 200,
    description: "Connection request rejected successfully",
    type: ConnectionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid ID format or connection not pending",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Not authorized to reject this request",
  })
  @ApiResponse({
    status: 404,
    description: "Connection request not found",
  })
  async rejectConnection(
    @CurrentUser("id") userId: string,
    @Param("id") connectionId: string
  ) {
    const connection = await this.connectionsService.rejectConnection(
      connectionId,
      userId
    );

    return {
      message: "Connection request rejected successfully",
      data: connection,
    };
  }

  @Delete(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Cancel sent connection request",
    description:
      "Cancel a pending connection request that you sent (only sender can cancel)",
  })
  @ApiParam({
    name: "id",
    description: "Connection request ID",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({
    status: 200,
    description: "Connection request cancelled successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid ID format or connection not pending",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Not authorized to cancel this request",
  })
  @ApiResponse({
    status: 404,
    description: "Connection request not found",
  })
  async cancelRequest(
    @CurrentUser("id") userId: string,
    @Param("id") connectionId: string
  ) {
    await this.connectionsService.cancelRequest(connectionId, userId);

    return {
      message: "Connection request cancelled successfully",
    };
  }

  @Post("block/:userId")
  @ApiOperation({
    summary: "Block a user",
    description:
      "Block a user, preventing all connection operations between you and them",
  })
  @ApiParam({
    name: "userId",
    description: "User ID to block",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({
    status: 201,
    description: "User blocked successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Cannot block yourself",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  @ApiResponse({
    status: 409,
    description: "User already blocked",
  })
  async blockUser(
    @CurrentUser("id") userId: string,
    @Param("userId") targetUserId: string
  ) {
    await this.connectionsService.blockUser(userId, targetUserId);

    return {
      message: "User blocked successfully",
    };
  }

  @Delete("unblock/:userId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Unblock a user",
    description:
      "Unblock a user that you previously blocked (deletes the connection document)",
  })
  @ApiParam({
    name: "userId",
    description: "User ID to unblock",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({
    status: 200,
    description: "User unblocked successfully",
  })
  @ApiResponse({
    status: 404,
    description: "No blocked connection found",
  })
  async unblockUser(
    @CurrentUser("id") userId: string,
    @Param("userId") targetUserId: string
  ) {
    await this.connectionsService.unblockUser(userId, targetUserId);

    return {
      message: "User unblocked successfully",
    };
  }

  @Get("received")
  @ApiOperation({
    summary: "Get received connection requests",
    description: "Get all pending connection requests that you have received",
  })
  @ApiResponse({
    status: 200,
    description: "List of received connection requests",
    type: [ConnectionResponseDto],
  })
  async getReceivedRequests(@CurrentUser("id") userId: string) {
    const requests = await this.connectionsService.getReceivedRequests(userId);

    return {
      message: "Received connection requests retrieved successfully",
      count: requests.length,
      data: requests,
    };
  }

  @Get("sent")
  @ApiOperation({
    summary: "Get sent connection requests",
    description: "Get all pending connection requests that you have sent",
  })
  @ApiResponse({
    status: 200,
    description: "List of sent connection requests",
    type: [ConnectionResponseDto],
  })
  async getSentRequests(@CurrentUser("id") userId: string) {
    const requests = await this.connectionsService.getSentRequests(userId);

    return {
      message: "Sent connection requests retrieved successfully",
      count: requests.length,
      data: requests,
    };
  }

  @Get()
  @ApiOperation({
    summary: "Get all connections",
    description: "Get all accepted connections (mutual friends)",
  })
  @ApiResponse({
    status: 200,
    description: "List of all connections",
    type: [ConnectionResponseDto],
  })
  async getConnections(@CurrentUser("id") userId: string) {
    const connections = await this.connectionsService.getConnections(userId);

    return {
      message: "Connections retrieved successfully",
      count: connections.length,
      data: connections,
    };
  }

  @Get("status/:userId")
  @ApiOperation({
    summary: "Check connection status with a user",
    description:
      "Check the connection status between you and another user (bidirectional)",
  })
  @ApiParam({
    name: "userId",
    description: "User ID to check connection status with",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({
    status: 200,
    description: "Connection status retrieved",
    type: ConnectionStatusResponseDto,
  })
  async getConnectionStatus(
    @CurrentUser("id") userId: string,
    @Param("userId") targetUserId: string
  ) {
    const status = await this.connectionsService.getConnectionStatus(
      userId,
      targetUserId
    );

    return status;
  }
}
