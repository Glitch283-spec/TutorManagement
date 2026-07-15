import { useState } from 'react';

import { useForm } from 'react-hook-form';

import { useNavigate } from 'react-router-dom';

import { toast } from 'react-hot-toast';

import { authService } from '../../services/authService';

import { useAuth } from '../../hooks/useAuth';

import { Mail, Lock, LogIn, GraduationCap } from 'lucide-react';

import { motion } from 'framer-motion';



export const Login = () => {

  const { register, handleSubmit, formState: { errors } } = useForm();

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const { setSession } = useAuth();



  const onSubmit = async (data: any) => {

    setLoading(true);

    try {

      const response = await authService.signIn(data.email, data.password);



      if (!response.profile) {

        toast.error('User profile not found');

        await authService.signOut();

        return;

      }



      setSession(response.profile, response.user);

      toast.success('Successfully logged in!');



      if (response.profile.role === 'parent') navigate('/parent');

      else if (response.profile.role === 'manager') navigate('/manager');

      else if (response.profile.role === 'tutor') navigate('/tutor');

      else navigate('/');

    } catch (error: any) {

      const message =

        error?.response?.data?.message || error.message || 'Failed to login';

      toast.error(message);

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="min-h-screen flex items-center justify-center bg-background p-4">

      <motion.div 

        initial={{ opacity: 0, y: 20 }}

        animate={{ opacity: 1, y: 0 }}

        className="max-w-md w-full"

      >

        <div className="text-center mb-8">

          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">

            <GraduationCap className="w-8 h-8 text-primary" />

          </div>

          <h1 className="text-3xl font-bold text-text">Welcome back</h1>

          <p className="text-secondary-text mt-2">Sign in to your account</p>

        </div>



        <div className="card-container">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div>

              <label className="block text-sm font-medium text-text mb-2">Email Address</label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                  <Mail className="h-5 w-5 text-gray-400" />

                </div>

                <input

                  type="email"

                  {...register("email", { 

                    required: "Email is required",

                    pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" }

                  })}

                  className="input-field pl-11"

                  placeholder="Enter your email"

                />

              </div>

              {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message as string}</p>}

            </div>



            <div>

              <label className="block text-sm font-medium text-text mb-2">Password</label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                  <Lock className="h-5 w-5 text-gray-400" />

                </div>

                <input

                  type="password"

                  {...register("password", { required: "Password is required" })}

                  className="input-field pl-11"

                  placeholder="Enter your password"

                />

              </div>

              {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message as string}</p>}

            </div>



            <button

              type="submit"

              disabled={loading}

              className="btn-primary w-full flex items-center justify-center mt-6"

            >

              {loading ? (

                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />

              ) : (

                <>

                  <LogIn className="w-5 h-5 mr-2" />

                  Sign In

                </>

              )}

            </button>

          </form>

        </div>

      </motion.div>

    </div>

  );

};



