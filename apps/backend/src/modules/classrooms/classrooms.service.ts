import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClassroomDto, UpdateClassroomDto } from './dto/classroom.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClassroomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(teacherId: string, createDto: CreateClassroomDto) {
    const code = this.generateClassCode();

    return this.prisma.classroom.create({
      data: {
        ...createDto,
        teacherId,
        code,
      },
    });
  }

  async findAllForUser(userId: string, role: string) {
    if (role === 'TEACHER' || role === 'ADMIN') {
      return this.prisma.classroom.findMany({
        where: {
          OR: [
            { teacherId: userId },
            ...(role === 'ADMIN' ? [{}] : []),
          ],
        },
        include: {
          _count: {
            select: { students: true, contents: true },
          },
        },
      });
    }

    // Student: find enrolled classrooms
    const enrollments = await this.prisma.classroomStudent.findMany({
      where: { studentId: userId, isActive: true },
      include: {
        classroom: {
          include: {
            teacher: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return enrollments.map((e) => e.classroom);
  }

  async findById(id: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { students: true, contents: true },
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    return classroom;
  }

  async getStudents(classroomId: string) {
    const enrollments = await this.prisma.classroomStudent.findMany({
      where: { classroomId, isActive: true },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentProfile: true,
          },
        },
      },
    });

    return enrollments.map((e) => ({
      ...e.student,
      joinedAt: e.joinedAt,
    }));
  }

  async update(id: string, updateDto: UpdateClassroomDto) {
    return this.prisma.classroom.update({
      where: { id },
      data: updateDto,
    });
  }

  async delete(id: string) {
    return this.prisma.classroom.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async joinByCode(studentId: string, code: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { code },
    });

    if (!classroom || !classroom.isActive) {
      throw new NotFoundException('Classroom not found or inactive');
    }

    const existingEnrollment = await this.prisma.classroomStudent.findUnique({
      where: {
        classroomId_studentId: {
          classroomId: classroom.id,
          studentId,
        },
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.isActive) {
        throw new ConflictException('Already enrolled in this classroom');
      }
      // Reactivate enrollment
      return this.prisma.classroomStudent.update({
        where: { id: existingEnrollment.id },
        data: { isActive: true },
      });
    }

    return this.prisma.classroomStudent.create({
      data: {
        classroomId: classroom.id,
        studentId,
      },
    });
  }

  async leave(classroomId: string, studentId: string) {
    return this.prisma.classroomStudent.updateMany({
      where: { classroomId, studentId },
      data: { isActive: false },
    });
  }

  private generateClassCode(): string {
    return uuidv4().substring(0, 8).toUpperCase();
  }
}
