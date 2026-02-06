# Angular + Firebase Quick Reference

Essential patterns for building MVPs fast with Angular and Firebase. Focus on what works, not what's perfect.

## Project Setup

### Initialize Angular
```bash
npm install -g @angular/cli
ng new my-app
cd my-app
```

### Install Firebase & AngularFire
```bash
npm install firebase @angular/fire
```

### Configure Firebase
1. Create project at https://console.firebase.google.com
2. Get your config from Project Settings
3. Add to `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
  }
};
```

### Setup AngularFire in App Module
```typescript
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ]
};
```

## Authentication Patterns

### Auth Service
```typescript
import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>;

  constructor(private auth: Auth) {
    this.user$ = authState(this.auth);
  }

  async signUp(email: string, password: string) {
    return await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async signIn(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async signOut() {
    return await signOut(this.auth);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }
}
```

### Login Component
```typescript
import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  template: `
    <form (ngSubmit)="login()">
      <input [(ngModel)]="email" type="email" placeholder="Email" required>
      <input [(ngModel)]="password" type="password" placeholder="Password" required>
      <button type="submit">Login</button>
      <p *ngIf="error">{{ error }}</p>
    </form>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async login() {
    try {
      await this.authService.signIn(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.error = error.message;
    }
  }
}
```

### Auth Guard
```typescript
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private auth: Auth, private router: Router) {}

  canActivate() {
    return authState(this.auth).pipe(
      map(user => {
        if (user) {
          return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
```

Apply to routes:
```typescript
const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] }
];
```

## Firestore Operations

### Firestore Service
```typescript
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from '@angular/fire/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private firestore: Firestore) {}

  // Create
  async addDocument(collectionName: string, data: any) {
    const collectionRef = collection(this.firestore, collectionName);
    return await addDoc(collectionRef, {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Read all (Observable)
  getDocuments(collectionName: string): Observable<any[]> {
    const collectionRef = collection(this.firestore, collectionName);
    return collectionData(collectionRef, { idField: 'id' });
  }

  // Read with filter
  async getFilteredDocuments(collectionName: string, field: string, value: any) {
    const collectionRef = collection(this.firestore, collectionName);
    const q = query(collectionRef, where(field, '==', value));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Update
  async updateDocument(collectionName: string, id: string, data: any) {
    const docRef = doc(this.firestore, collectionName, id);
    return await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
  }

  // Delete
  async deleteDocument(collectionName: string, id: string) {
    const docRef = doc(this.firestore, collectionName, id);
    return await deleteDoc(docRef);
  }
}
```

### Component Using Firestore
```typescript
import { Component, OnInit } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-tasks',
  template: `
    <div *ngFor="let task of tasks">
      {{ task.title }}
      <button (click)="deleteTask(task.id)">Delete</button>
    </div>
    <form (ngSubmit)="addTask()">
      <input [(ngModel)]="newTask" placeholder="New task">
      <button type="submit">Add</button>
    </form>
  `
})
export class TasksComponent implements OnInit {
  tasks: any[] = [];
  newTask = '';

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.firestoreService.getDocuments('tasks').subscribe(tasks => {
      this.tasks = tasks;
    });
  }

  async addTask() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    await this.firestoreService.addDocument('tasks', {
      title: this.newTask,
      userId: user.uid,
      completed: false
    });
    this.newTask = '';
  }

  async deleteTask(id: string) {
    await this.firestoreService.deleteDocument('tasks', id);
  }
}
```

## Firebase Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read/write their own documents
    match /tasks/{taskId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
    
    // Public read, authenticated write
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User can only access their own files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public images
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Common Patterns

### Form with Reactive Forms
```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirestoreService } from './firestore.service';

@Component({
  selector: 'app-task-form',
  template: `
    <form [formGroup]="taskForm" (ngSubmit)="onSubmit()">
      <input formControlName="title" placeholder="Task title">
      <textarea formControlName="description"></textarea>
      <button type="submit" [disabled]="!taskForm.valid">Save</button>
    </form>
  `
})
export class TaskFormComponent implements OnInit {
  taskForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private firestoreService: FirestoreService
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['']
    });
  }

  async onSubmit() {
    if (this.taskForm.valid) {
      await this.firestoreService.addDocument('tasks', this.taskForm.value);
      this.taskForm.reset();
    }
  }
}
```

### File Upload to Firebase Storage
```typescript
import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(private storage: Storage) {}

  async uploadFile(file: File, path: string) {
    const storageRef = ref(this.storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }
}
```

```typescript
// Component
async uploadAvatar(event: any) {
  const file = event.target.files[0];
  const user = this.authService.getCurrentUser();
  if (!file || !user) return;

  const path = `avatars/${user.uid}/${file.name}`;
  const url = await this.storageService.uploadFile(file, path);
  console.log('File uploaded:', url);
}
```

### Real-time Updates
```typescript
import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where } from '@angular/fire/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-real-time-tasks',
  template: `
    <div *ngFor="let task of tasks$ | async">
      {{ task.title }}
    </div>
  `
})
export class RealTimeTasksComponent implements OnInit {
  tasks$!: Observable<any[]>;

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    const tasksRef = collection(this.firestore, 'tasks');
    this.tasks$ = collectionData(tasksRef, { idField: 'id' });
  }
}
```

## NestJS Backend (Alternative to Firebase Functions)

### Basic Setup
```bash
npm i -g @nestjs/cli
nest new backend
cd backend
npm install @nestjs/config firebase-admin
```

### Firebase Admin Setup
```typescript
// firebase.module.ts
import { Module } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Module({})
export class FirebaseModule {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}
```

### Tasks Controller
```typescript
import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Post()
  create(@Body() createTaskDto: any) {
    return this.tasksService.create(createTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
```

### Tasks Service with Firestore
```typescript
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class TasksService {
  private db = admin.firestore();

  async findAll() {
    const snapshot = await this.db.collection('tasks').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async create(data: any) {
    const docRef = await this.db.collection('tasks').add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  }

  async remove(id: string) {
    await this.db.collection('tasks').doc(id).delete();
    return { deleted: true };
  }
}
```

## Deployment

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Vercel (Angular)
```bash
npm i -g vercel
vercel
```

Add `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Firebase Functions (for NestJS API)
```bash
firebase init functions
# Copy your NestJS dist/ to functions folder
firebase deploy --only functions
```

## Troubleshooting

### "Permission denied" errors
- Check Firebase Security Rules
- Verify user is authenticated
- Ensure userId matches in rules

### Module import errors
- Check provideFirebaseApp setup in app.config
- Verify all @angular/fire imports
- Run `npm install` again

### Build errors
- Check TypeScript version compatibility
- Update Angular CLI: `ng update @angular/cli @angular/core`
- Clear node_modules and reinstall

## Performance Tips

1. **Use OnPush change detection** for better performance
2. **Lazy load modules** for large apps
3. **Use trackBy in *ngFor** to optimize rendering
4. **Implement pagination** for large Firestore collections
5. **Use Firebase indexes** for complex queries

## MVP-Specific Advice

**Start Simple:**
- Email/password auth only
- Basic Firestore rules (user owns data)
- No real-time unless core to product
- Use Angular Material for quick UI

**Add Later:**
- Google/Facebook auth
- Complex security rules
- Real-time features
- Custom backend (NestJS)

**Skip for MVP:**
- Offline support
- Advanced caching
- Server-side rendering
- GraphQL
- Microservices
